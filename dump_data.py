import csv
import json
import os

base_path = r"C:\Users\fabio\Documents\Progetto corso serale\frontend\File orario corso serale"

def parse(name):
    path = os.path.join(base_path, name)
    try:
        with open(path, 'r', encoding='windows-1252', errors='replace') as f:
            reader = csv.reader(f, delimiter='\t')
            return list(reader)
    except Exception as e:
        return str(e)

res = {
    'classi': parse('classi.txt'),
    'materie': parse('materie.txt'),
    'docenti': parse('docenti.txt'),
    'lezioni': parse('lezioni.txt')[:10],
    'classilezioni': parse('classilezioni.txt')[:10],
    'docentilezioni': parse('docentilezioni.txt')[:10]
}

with open(r'C:\Users\fabio\Documents\Progetto corso serale\frontend\debug_dump.json', 'w', encoding='utf-8') as f:
    json.dump(res, f, indent=2)
