"""Embedding providers for the private-catalog index.

- local  : sentence-transformers/all-MiniLM-L6-v2 exported to ONNX (Chroma's
           bundled embedding function). Downloads once (~80 MB), then offline.
- openai : text-embedding-3-small via the OpenAI API.

The ingest step records which embedder built the index; retrieval refuses to
query with a different one (a silent mismatch would corrupt similarity).
"""
from __future__ import annotations


from app.config import settings


class Embedder:
    name: str = "base"

    def encode(self, texts: list[str]) -> list[list[float]]:  # pragma: no cover
        raise NotImplementedError


class LocalMiniLMEmbedder(Embedder):
    name = "local-minilm-l6-v2"

    def __init__(self) -> None:
        from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

        self._ef = ONNXMiniLM_L6_V2()

    def encode(self, texts: list[str]) -> list[list[float]]:
        try:
            out = self._ef(input=texts)
        except TypeError:  # older chroma EF signature
            out = self._ef(texts)
        return [list(map(float, v)) for v in out]


class OpenAIEmbedder(Embedder):
    def __init__(self) -> None:
        from openai import OpenAI

        self._client = OpenAI()
        self._model = settings.OPENAI_EMBEDDING_MODEL
        self.name = f"openai-{self._model}"

    def encode(self, texts: list[str]) -> list[list[float]]:
        out: list[list[float]] = []
        for i in range(0, len(texts), 100):
            batch = [t[:6000] for t in texts[i : i + 100]]
            resp = self._client.embeddings.create(model=self._model, input=batch)
            out.extend([d.embedding for d in resp.data])
        return out




class HashEmbedder:
    """Deterministic token-hash vectors. Test-only: lets ingest and retrieval
    run offline with no model download. Not semantic."""
    name = "hash-384-test-only"
    dim = 384

    def encode(self, texts):
        import hashlib
        out = []
        for text in texts:
            vec = [0.0] * self.dim
            for tok in str(text).lower().split():
                h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
                vec[h % self.dim] += 1.0
            norm = sum(v * v for v in vec) ** 0.5 or 1.0
            out.append([v / norm for v in vec])
        return out

def get_embedder() -> Embedder:
    p = settings.EMBEDDINGS_PROVIDER
    if p == "local":
        return LocalMiniLMEmbedder()
    if p == "openai":
        return OpenAIEmbedder()
    if p == "hash":
        return HashEmbedder()
    raise ValueError(f"Unknown EMBEDDINGS_PROVIDER={p!r} (local | openai)")
