# Data

## Private catalog source

The catalog is the Amazon Product Dataset 2020 from Kaggle:

> https://www.kaggle.com/datasets/promptcloud/amazon-product-dataset-2020

The dataset is not redistributed in this repository (Kaggle datasets carry
their own licenses). The Colab notebooks download it automatically at run
time (public dataset - no account needed):

```python
import kagglehub
path = kagglehub.dataset_download("promptcloud/amazon-product-dataset-2020")
```

For a local machine: download the CSV from Kaggle yourself and ingest the
slice this project uses:

```bash
# run from backend/
python -m rag.ingest --csv ../data/raw/<the-kaggle-file>.csv --category "Home & Kitchen"
```

--category keeps rows whose category column contains the term
(case-insensitive). --limit caps the index size for quick local tests.

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
