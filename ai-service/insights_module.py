def analyze_data(df):
    insights = {}

    # 1. Trend Analysis: basic mean for demo
    insights['trends'] = df.mean(numeric_only=True).to_dict()

    # 2. Anomaly Detection (Z-score > 3)
    anomalies = {}
    for col in df.select_dtypes(include='number').columns:
        z = ((df[col] - df[col].mean()) / df[col].std()).abs()
        anomalies[col] = df[z > 3].to_dict(orient='records')
    insights['anomalies'] = anomalies

    # 3. Correlation
    insights['correlations'] = df.corr(numeric_only=True).to_dict()

    return insights
