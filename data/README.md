# Data

## Private catalog source (assignment dataset)

The brief specifies the **Amazon Product Dataset 2020** slice from Kaggle:

> https://www.kaggle.com/datasets/promptcloud/amazon-product-dataset-2020

That dataset is **not redistributed in this repo** (Kaggle datasets carry
their own licenses). The Colab walkthrough downloads it automatically at
run time via `kagglehub` (public dataset, no account needed):

```python
import kagglehub
path = kagglehub.dataset_download("promptcloud/amazon-product-dataset-2020")
```

For a local machine, download it yourself, then ingest a curated slice:

```bash
# 1) download + unzip from Kaggle, put the CSV under data/raw/, e.g.:
#    data/raw/marketing_sample_for_amazon_com-ecommerce__20200101_20200131__10k_data.csv

# 2) build parquet files + the Chroma vector index (run from backend/)
cd backend
python -m rag.ingest --csv ../data/raw/<the-kaggle-file>.csv \
    --category "Household" --limit 3000
```

`--category` filters rows whose category column contains the substring
(case-insensitive) — use it to pick the household/cleaning slice the brief
suggests. `--limit` caps the index size for fast local builds.

## Generated outputs (git-ignored)

- `data/processed/products.parquet` — normalized catalog (doc_id, title,
  brand, category, price, rating, features, ingredients, eco_friendly,
  size_oz, price_per_oz)
- `data/processed/reviews.parquet` — exploded review snippets per doc_id
  (written only when the source CSV carries review text; this Kaggle file does not)
- `backend/storage/chroma/` — the vector index (embeddings over
  title + features + review snippets)
- `backend/storage/catalog_meta.json` — which embedder built the index
  (retrieval refuses to run against a mismatched index)
