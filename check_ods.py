import pandas as pd
import os

file_path = r"C:\Users\fabio\Documents\Progetto corso serale\frontend\File orario corso serale\curriculo.ods"
try:
    df = pd.read_excel(file_path, engine='odf')
    with open('curriculum_sample.txt', 'w', encoding='utf-8') as f:
        f.write("COLUMNS:\n")
        f.write(str(df.columns.tolist()) + "\n\n")
        f.write("FIRST 20 ROWS:\n")
        f.write(df.head(20).to_string())
    print("Written to curriculum_sample.txt")
except Exception as e:
    print(f"FAILURE: {e}")
