import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score, accuracy_score, f1_score


def train_statistical_baselines(
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_cost_train: pd.Series,
    y_cost_test: pd.Series,
    y_delay_train: pd.Series,
    y_delay_test: pd.Series
) -> Dict[str, Any]:
    """
    Directly answers SIH26103 Dimension (b) and SRS FR-8.3:
    Trains conventional statistical baselines (Ordinary Least Squares Linear Regression
    and Logistic Regression) on identical train/test splits.
    """
    # 1. Baseline Cost Overrun Model (OLS Linear Regression)
    ols_cost = LinearRegression()
    ols_cost.fit(X_train, y_cost_train)
    y_cost_pred = ols_cost.predict(X_test)

    r2_cost = float(r2_score(y_cost_test, y_cost_pred))
    rmse_cost = float(np.sqrt(mean_squared_error(y_cost_test, y_cost_pred)))
    mae_cost = float(mean_absolute_error(y_cost_test, y_cost_pred))
    mape_cost = float(np.mean(np.abs((y_cost_test - y_cost_pred) / np.maximum(y_cost_test, 1.0))) * 100)

    # 2. Baseline Schedule Delay Model (OLS Linear Regression)
    ols_delay = LinearRegression()
    ols_delay.fit(X_train, y_delay_train)
    y_delay_pred = ols_delay.predict(X_test)

    r2_delay = float(r2_score(y_delay_test, y_delay_pred))
    rmse_delay = float(np.sqrt(mean_squared_error(y_delay_test, y_delay_pred)))
    mae_delay = float(mean_absolute_error(y_delay_test, y_delay_pred))

    # 3. Baseline Binary Classification (Logistic Regression)
    from sklearn.preprocessing import StandardScaler
    y_flag_train = (y_cost_train > 5.0).astype(int)
    y_flag_test = (y_cost_test > 5.0).astype(int)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    log_reg = LogisticRegression(max_iter=1000)
    log_reg.fit(X_train_scaled, y_flag_train)
    y_flag_pred = log_reg.predict(X_test_scaled)

    acc = float(accuracy_score(y_flag_test, y_flag_pred))
    f1 = float(f1_score(y_flag_test, y_flag_pred, zero_division=0))

    return {
        "cost_baseline": {
            "model_name": "Ordinary Least Squares (OLS) Linear Regression",
            "model_type": "STATISTICAL_BASELINE",
            "target_variable": "cost_overrun_pct",
            "r2_score": round(max(0.0, r2_cost), 4),
            "rmse": round(rmse_cost, 2),
            "mae": round(mae_cost, 2),
            "mape": round(min(100.0, mape_cost), 2),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "notes": "Conventional linear specification assuming homoscedasticity and linear feature effects."
        },
        "delay_baseline": {
            "model_name": "OLS Linear Regression (Schedule Delay)",
            "model_type": "STATISTICAL_BASELINE",
            "target_variable": "delay_months",
            "r2_score": round(max(0.0, r2_delay), 4),
            "rmse": round(rmse_delay, 2),
            "mae": round(mae_delay, 2),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "notes": "Linear schedule forecast without non-linear interaction terms."
        },
        "classification_baseline": {
            "model_name": "Logistic Regression (Overrun Threshold)",
            "model_type": "STATISTICAL_BASELINE",
            "target_variable": "cost_overrun_flag",
            "accuracy": round(acc, 4),
            "f1_score": round(f1, 4),
            "training_samples": len(X_train),
            "test_samples": len(X_test),
            "notes": "Logit link model for binary risk threshold classification."
        }
    }
