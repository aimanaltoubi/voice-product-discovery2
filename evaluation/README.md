# Evaluation - Measured Accuracy

This folder holds the standalone evaluation for DiscoveryVoice:

- evaluation.ipynb - runs the nineteen-measure harness against the real pipeline in this repository and renders every section with an independent re-check of each target
- EVALUATION_ANALYSIS.txt - the full story of how each failing measure led to a named pipeline fix plus the open issues
- evaluation_report.json and evaluation_cases.csv - saved by the notebook after a run

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/aimanaltoubi/voice-product-discovery2/blob/main/evaluation/evaluation.ipynb)

## The engine

The harness lives in this repository and runs the real pipeline - no stand-ins:

- backend/app/evaluation.py - the cases and probes and targets and every metric implementation
- backend/graph/dv.py - the safety net and the grounding layer the verdicts exercise
- three ways to run it: this notebook - the /evaluation page inside the app - or POST /api/evaluate

## What is measured

- speech: WER and CER on a speak-then-transcribe round trip (the Whisper paper measures)
- router: accuracy + macro F1 + a confusion matrix + constraint extraction (budget and eco)
- retrieval: Precision at 3 + Recall at 3 and 8 and 20 + MRR + NDCG at 3 on labeled probes
- hybrid filters: every returned result must satisfy the metadata filter it was asked for (the soft fallback ladder is honored)
- answers: faithfulness and relevance judged in the RAGAS style + provenance of every claim and citation
- system: latency budgets per stage + case verdicts by category + index integrity + reconciliation coverage
- behavior under pressure (optional): a multi-turn ProofAgent exam in the last part - runs when the proofagent and OPENAI_API_KEY secrets exist and skips cleanly otherwise

## Latest measured results

Fill the result column from the scorecard of the saved run. The executed notebook in this folder is the source of truth for every number.

| measure | result | target |
|---|---|---|
| ASR WER | - | 10% or less |
| ASR CER | - | 5% or less |
| Router accuracy | - | 90% or more |
| Router macro F1 | - | 0.85 or more |
| Constraint extraction accuracy | - | 85% or more |
| Retrieval Precision@3 | - | 0.8 or more |
| Retrieval Recall@3 | - | 0.2 or more |
| Retrieval Recall@8 | - | 0.35 or more |
| Retrieval Recall@20 | - | 0.5 or more |
| Retrieval MRR | - | 0.8 or more |
| Retrieval NDCG@3 | - | 0.8 or more |
| Answer faithfulness | - | 90% or more |
| Answer relevance | - | 0.8 or more |
| Latency budget compliance | - | 90% or more |
| Case accuracy - overall | - | 90% or more |
| Index integrity | - | 90% or more |
| Hybrid filter compliance | - | 95% or more |
| Reconciliation coverage | - | 80% or more |
| Provenance / grounding | - | 95% or more |
| ProofAgent final score (optional) | - | reported 0 to 10 |

## Limitations stated plainly

- the faithfulness and relevance judges are themselves models - strong signal rather than ground truth
- the speech round trip measures the speak and transcribe pair together
- live cases depend on what the web returns during the run
- retrieval quality numbers assume the real encoder. The offline test encoder (hash) exercises the machinery only
