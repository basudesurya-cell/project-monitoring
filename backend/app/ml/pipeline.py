import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier, RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, precision_score, recall_score, f1_score
from ..models import Project, ModelMetric
from .baseline import train_statistical_baselines

# Global in-memory cache for trained model objects
TRAINED_MODELS = {
    "cost_model": None,
    "time_model": None,
    "classifier": None,
    "last_metrics": {}
}


def prepare_feature_matrix(projects: list) -> Tuple[Any, Any, Any, Any]:
    """Prepares structured feature matrices X and targets y from Project records."""
    data = []
    for p in projects:
        exp_factor = (p.cumulative_expenditure / max(p.original_cost, 0.01)) * 100.0
        exp_progress_diff = exp_factor - p.physical_progress
        milestone_ratio = p.milestones_completed / max(p.milestones_total, 1)

        data.append({
            "original_cost": float(p.original_cost),
            "revised_cost": float(p.revised_cost),
            "cumulative_expenditure": float(p.cumulative_expenditure),
            "physical_progress": float(p.physical_progress),
            "exp_progress_diff": float(exp_progress_diff),
            "milestone_ratio": float(milestone_ratio),
            "sector": str(p.sector),
            "ministry": str(p.ministry),
            "cost_overrun_pct": float(p.cost_overrun_pct),
            "delay_months": float(p.delay_months),
            "cost_overrun_flag": int(p.cost_overrun_flag)
        })

    df = pd.DataFrame(data)
    if df.empty:
        return None, None, None, None

    # One-hot encode top categorical features
    feature_cols = ["original_cost", "cumulative_expenditure", "physical_progress", "exp_progress_diff", "milestone_ratio"]
    X_num = df[feature_cols]
    X_cat = pd.get_dummies(df[["sector", "ministry"]], drop_first=True, dtype=float)
    X = pd.concat([X_num, X_cat], axis=1)

    y_cost = df["cost_overrun_pct"]
    y_delay = df["delay_months"]
    y_flag = df["cost_overrun_flag"]

    return X, y_cost, y_delay, y_flag


def train_and_evaluate_models(session: Session, sector_filter: Optional[str] = "ALL") -> Dict[str, Any]:
    """
    Trains advanced ML models and statistical baselines side-by-side,
    persisting performance metrics into the database (SRS FR-3.1, FR-3.2, FR-8.3).
    """
    query = session.query(Project)
    if sector_filter and sector_filter.upper() != "ALL":
        query = query.filter(Project.sector == sector_filter)

    projects = query.all()
    if len(projects) < 30:
        return {"error": f"Insufficient data samples ({len(projects)}) for reliable model training."}

    X, y_cost, y_delay, y_flag = prepare_feature_matrix(projects)
    if X is None or len(X) == 0:
        return {"error": "Failed to construct feature matrix."}

    # Deterministic 80/20 train-test split
    X_train, X_test, y_cost_train, y_cost_test, y_delay_train, y_delay_test, y_flag_train, y_flag_test = train_test_split(
        X, y_cost, y_delay, y_flag, test_size=0.20, random_state=42
    )

    # 1. Advanced ML Cost Overrun Model (Gradient Boosting)
    cost_model = GradientBoostingRegressor(
        n_estimators=120,
        learning_rate=0.08,
        max_depth=4,
        random_state=42
    )
    cost_model.fit(X_train, y_cost_train)
    y_cost_pred = cost_model.predict(X_test)

    r2_cost = float(r2_score(y_cost_test, y_cost_pred))
    rmse_cost = float(np.sqrt(mean_squared_error(y_cost_test, y_cost_pred)))
    mae_cost = float(mean_absolute_error(y_cost_test, y_cost_pred))
    mape_cost = float(np.mean(np.abs((y_cost_test - y_cost_pred) / np.maximum(y_cost_test, 1.0))) * 100)

    # 2. Advanced ML Time Overrun Model (Random Forest / Gradient Boosting)
    delay_model = RandomForestRegressor(
        n_estimators=100,
        max_depth=6,
        random_state=42
    )
    delay_model.fit(X_train, y_delay_train)
    y_delay_pred = delay_model.predict(X_test)

    r2_delay = float(r2_score(y_delay_test, y_delay_pred))
    rmse_delay = float(np.sqrt(mean_squared_error(y_delay_test, y_delay_pred)))
    mae_delay = float(mean_absolute_error(y_delay_test, y_delay_pred))

    # 3. Advanced ML Risk Classifier
    clf = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=3,
        random_state=42
    )
    clf.fit(X_train, y_flag_train)
    y_flag_pred = clf.predict(X_test)

    acc = float(accuracy_score(y_flag_test, y_flag_pred))
    prec = float(precision_score(y_flag_test, y_flag_pred, zero_division=0))
    rec = float(recall_score(y_flag_test, y_flag_pred, zero_division=0))
    f1 = float(f1_score(y_flag_test, y_flag_pred, zero_division=0))

    # 4. Statistical Baseline Evaluation (on identical train/test splits per SIH Dimension b)
    baseline_results = train_statistical_baselines(
        X_train=X_train,
        X_test=X_test,
        y_cost_train=y_cost_train,
        y_cost_test=y_cost_test,
        y_delay_train=y_delay_train,
        y_delay_test=y_delay_test
    )

    # Persist in DB
    # Clear older metrics for this sector filter
    session.query(ModelMetric).filter(ModelMetric.sector_filter == sector_filter).delete()

    # Save ML metrics
    ml_cost_metric = ModelMetric(
        model_name="Gradient Boosting Cost Overrun Model",
        model_type="ML_MODEL",
        target_variable="cost_overrun_pct",
        sector_filter=sector_filter,
        r2_score=round(r2_cost, 4),
        rmse=round(rmse_cost, 2),
        mae=round(mae_cost, 2),
        mape=round(min(100.0, mape_cost), 2),
        training_samples=len(X_train),
        test_samples=len(X_test),
        notes="Non-linear tree ensemble capturing complex cost interactions."
    )
    ml_delay_metric = ModelMetric(
        model_name="Random Forest Schedule Delay Model",
        model_type="ML_MODEL",
        target_variable="delay_months",
        sector_filter=sector_filter,
        r2_score=round(r2_delay, 4),
        rmse=round(rmse_delay, 2),
        mae=round(mae_delay, 2),
        training_samples=len(X_train),
        test_samples=len(X_test),
        notes="Ensemble tree model capturing non-linear timeline slippage patterns."
    )
    ml_clf_metric = ModelMetric(
        model_name="Gradient Boosting Risk Classifier",
        model_type="ML_MODEL",
        target_variable="cost_overrun_flag",
        sector_filter=sector_filter,
        accuracy=round(acc, 4),
        precision=round(prec, 4),
        recall=round(rec, 4),
        f1_score=round(f1, 4),
        training_samples=len(X_train),
        test_samples=len(X_test),
        notes="Predicts likelihood of project crossing the critical overrun threshold."
    )

    # Save baseline metrics
    b_cost = baseline_results["cost_baseline"]
    b_delay = baseline_results["delay_baseline"]
    b_clf = baseline_results["classification_baseline"]

    base_cost_metric = ModelMetric(
        model_name=b_cost["model_name"],
        model_type=b_cost["model_type"],
        target_variable=b_cost["target_variable"],
        sector_filter=sector_filter,
        r2_score=b_cost["r2_score"],
        rmse=b_cost["rmse"],
        mae=b_cost["mae"],
        mape=b_cost["mape"],
        training_samples=b_cost["training_samples"],
        test_samples=b_cost["test_samples"],
        notes=b_cost["notes"]
    )
    base_delay_metric = ModelMetric(
        model_name=b_delay["model_name"],
        model_type=b_delay["model_type"],
        target_variable=b_delay["target_variable"],
        sector_filter=sector_filter,
        r2_score=b_delay["r2_score"],
        rmse=b_delay["rmse"],
        mae=b_delay["mae"],
        training_samples=b_delay["training_samples"],
        test_samples=b_delay["test_samples"],
        notes=b_delay["notes"]
    )
    base_clf_metric = ModelMetric(
        model_name=b_clf["model_name"],
        model_type=b_clf["model_type"],
        target_variable=b_clf["target_variable"],
        sector_filter=sector_filter,
        accuracy=b_clf["accuracy"],
        f1_score=b_clf["f1_score"],
        training_samples=b_clf["training_samples"],
        test_samples=b_clf["test_samples"],
        notes=b_clf["notes"]
    )

    session.add_all([
        ml_cost_metric, ml_delay_metric, ml_clf_metric,
        base_cost_metric, base_delay_metric, base_clf_metric
    ])
    session.commit()

    # Cache trained models in-memory
    TRAINED_MODELS["cost_model"] = cost_model
    TRAINED_MODELS["time_model"] = delay_model
    TRAINED_MODELS["classifier"] = clf
    TRAINED_MODELS["last_metrics"] = {
        "ml": {
            "r2_cost": r2_cost,
            "rmse_cost": rmse_cost,
            "r2_delay": r2_delay,
            "rmse_delay": rmse_delay,
            "accuracy": acc,
            "f1": f1
        },
        "baseline": {
            "r2_cost": b_cost["r2_score"],
            "rmse_cost": b_cost["rmse"],
            "r2_delay": b_delay["r2_score"],
            "rmse_delay": b_delay["rmse"],
            "accuracy": b_clf["accuracy"],
            "f1": b_clf["f1_score"]
        }
    }

    return {
        "status": "success",
        "sector": sector_filter,
        "records_trained": len(X_train),
        "records_tested": len(X_test),
        "ml_metrics": TRAINED_MODELS["last_metrics"]["ml"],
        "baseline_metrics": TRAINED_MODELS["last_metrics"]["baseline"]
    }
