#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IZONE Machine Learning Prediction Service
Handles loading and predicting with trained RandomForest model
"""

import sys
import os
import json
import pandas as pd
import joblib
import numpy as np
from typing import Dict, List, Any
import warnings
warnings.filterwarnings('ignore')

class DropoutPredictionService:
    """
    Service for loading and using the dropout prediction model
    """

    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), 'model_dropout_tuned.pkl')
        self.feature_columns = [
            'LopID', 'TyLeChuyenCan_NuaDau', 'SoBuoiVang_NuaDau',
            'SoBuoiVangDau', 'DiemGiuaKy', 'KetQuaGiuaKy',
            'SoNgayDangKySom', 'TuoiHocVien', 'KhoaHocID',
            'GiangVienID', 'DiaDiemID'
        ]

    def load_model(self) -> bool:
        """Load the trained model from pickle file"""
        try:
            if not os.path.exists(self.model_path):
                print(f"ERROR: Model file not found at {self.model_path}")
                return False

            self.model = joblib.load(self.model_path)
            print("SUCCESS: Model loaded successfully")
            return True

        except Exception as e:
            print(f"ERROR: Failed to load model: {str(e)}")
            return False

    def preprocess_data(self, data: Dict[str, Any]) -> pd.DataFrame:
        """Preprocess single student data for prediction"""
        try:
            # Create DataFrame with single row
            df = pd.DataFrame([data])

            # Handle missing values (fill with 0 like in training)
            df = df.fillna(0)

            # Ensure all required columns are present
            for col in self.feature_columns:
                if col not in df.columns:
                    df[col] = 0

            # Select only required columns in correct order
            df = df[self.feature_columns]

            return df

        except Exception as e:
            print(f"ERROR: Failed to preprocess data: {str(e)}")
            raise

    def predict_single(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Predict dropout risk for single student"""
        try:
            if self.model is None and not self.load_model():
                return {"error": "Model not loaded"}

            # Preprocess data
            processed_df = self.preprocess_data(data)

            # Make prediction
            probabilities = self.model.predict_proba(processed_df)
            dropout_prob = probabilities[0][1]  # Probability of class 1 (dropout)

            return {
                "dropout_risk": float(dropout_prob),
                "dropout_percentage": round(float(dropout_prob * 100), 2),
                "status": "high_risk" if dropout_prob > 0.5 else "low_risk"
            }

        except Exception as e:
            return {
                "error": f"Prediction failed: {str(e)}",
                "dropout_risk": 0.0,
                "dropout_percentage": 0.0,
                "status": "unknown"
            }

    def predict_batch(self, data_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Predict dropout risk for multiple students"""
        try:
            if self.model is None and not self.load_model():
                return [{"error": "Model not loaded"} for _ in data_list]

            results = []

            for data in data_list:
                result = self.predict_single(data)
                results.append(result)

            return results

        except Exception as e:
            print(f"ERROR: Batch prediction failed: {str(e)}")
            return [{"error": f"Batch prediction failed: {str(e)}"} for _ in data_list]


def main():
    """
    Main function for command-line usage
    Expects JSON input from stdin
    """
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Initialize prediction service
        service = DropoutPredictionService()

        # Process based on operation type
        operation = input_data.get('operation', 'predict_single')

        if operation == 'predict_single':
            data = input_data.get('data', {})
            result = service.predict_single(data)
            print(json.dumps(result, indent=2))

        elif operation == 'predict_batch':
            data_list = input_data.get('data', [])
            results = service.predict_batch(data_list)
            print(json.dumps(results, indent=2))

        else:
            print(json.dumps({"error": f"Unknown operation: {operation}"}))

    except Exception as e:
        print(json.dumps({"error": f"Service error: {str(e)}"}))


if __name__ == "__main__":
    main()
