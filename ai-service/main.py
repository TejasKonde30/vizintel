from fastapi import FastAPI, File, UploadFile
import pandas as pd
from insights_module import analyze_data

app = FastAPI()

@app.post("/generate-insights/")
async def generate_insights(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)
    insights = analyze_data(df)
    return {"insights": insights}
