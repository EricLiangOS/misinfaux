import pandas as pd
import numpy as np
import re

def clean_text(text):
    """Cleans the input text by removing unwanted characters and formatting."""
    text = re.sub(r'\s+', ' ', text)  # Remove extra whitespace
    text = re.sub(r'[^\w\s]', '', text)  # Remove punctuation
    return text.strip()

def load_data(file_path):
    """Loads data from a CSV file and returns a DataFrame."""
    return pd.read_csv(file_path)

def preprocess_data(df):
    """Preprocesses the DataFrame by cleaning text and handling missing values."""
    df['cleaned_text'] = df['text'].apply(clean_text)
    df.dropna(subset=['cleaned_text'], inplace=True)
    return df

def split_data(df, test_size=0.2):
    """Splits the DataFrame into training and testing sets."""
    from sklearn.model_selection import train_test_split
    train_df, test_df = train_test_split(df, test_size=test_size, random_state=42)
    return train_df, test_df

def save_processed_data(train_df, test_df, train_file_path, test_file_path):
    """Saves the processed training and testing DataFrames to CSV files."""
    train_df.to_csv(train_file_path, index=False)
    test_df.to_csv(test_file_path, index=False)