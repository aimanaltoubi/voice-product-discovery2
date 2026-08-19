# Evaluation - Measured Accuracy

This folder holds the standalone evaluation for DiscoveryVoice:

- evaluation.ipynb - the EXECUTED notebook from the latest run. Every output below is visible inside it cell by cell
- EVALUATION_ANALYSIS.txt - each failing measure and the code change that fixed it plus the open issues

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/aimanaltoubi/voice-product-discovery2/blob/main/evaluation/evaluation.ipynb)

## The engine

The harness lives in this repository and runs the real pipeline - no stand-ins:

- backend/app/evaluation.py - the cases and probes and targets and every metric implementation
- backend/graph/dv.py - the safety net and the grounding layer the verdicts exercise
- three ways to run it: this notebook - the /evaluation page inside the app - or POST /api/evaluate

## Latest run - all tested outcomes

Run generated 2026-08-19 | Home & Kitchen slice (712 products) | model gpt-4o-mini | encoder MiniLM local

### Scorecard - 17 of 19 targets met

| measure | result | target | status |
|---|---|---|---|
| ASR WER | 0% | 10% or less | PASS |
| ASR CER | 0% | 5% or less | PASS |
| Router accuracy | 100% | 90% or more | PASS |
| Router macro F1 | 1.00 | 0.85 or more | PASS |
| Constraint extraction accuracy | 100% | 85% or more | PASS |
| Retrieval Precision@3 | 89% | 0.8 or more | PASS |
| Retrieval Recall@3 | 19% | 0.2 or more | FAIL |
| Retrieval Recall@8 | 46% | 0.35 or more | PASS |
| Retrieval Recall@20 | 71% | 0.5 or more | PASS |
| Retrieval MRR | 1.00 | 0.8 or more | PASS |
| Retrieval NDCG@3 | 0.92 | 0.8 or more | PASS |
| Answer faithfulness | 86% | 90% or more | FAIL |
| Answer relevance | 0.80 | 0.8 or more | PASS |
| Latency budget compliance | 100% | 90% or more | PASS |
| Case accuracy - overall | 100% | 90% or more | PASS |
| Index integrity | 98% | 90% or more | PASS |
| Hybrid filter compliance | 100% | 95% or more | PASS |
| Reconciliation coverage | 100% | 80% or more | PASS |
| Provenance / grounding | 100% | 95% or more | PASS |

The two misses stated plainly: Recall@3 is a breadth measure - three results can only reach 19% when a probe has a dozen relevant products in the catalog - ranking quality on the same probes is at ceiling (MRR 1.00 - NDCG 0.92). Faithfulness is scored by a model judge re-deriving claims from the answer text - the deterministic check of the pipeline's own claims scored 24 of 24 traceable (provenance 100%).

### Speech round trip

| reference | WER | CER |
|---|---|---|
| Find me an eco friendly kids comforter set under fifty dollars | 0% | 0% |
| I need a microfiber sheet set under thirty dollars | 0% | 0% |
| Show me a classroom learning rug for kids | 0% | 0% |

### Router

Confusion matrix perfect: catalog 4/4 - live 4/4 - safety 3/3. Per-class precision and recall 100% everywhere. Constraint extraction 4 of 4 (budgets and eco flags).

### Retrieval per probe

| probe | P@3 | R@3 | R@8 | R@20 | RR | NDCG |
|---|---|---|---|---|---|---|
| soft microfiber comforter set | 67% | 15% | 38% | 77% | 1.00 | 0.77 |
| microfiber sheet set | 100% | 0% | 50% | 50% | 1.00 | 1.00 |
| kids rug | 67% | 0% | 25% | 25% | 1.00 | 0.77 |
| kids lunch box | 100% | 23% | 62% | 100% | 1.00 | 1.00 |
| privacy window film | 100% | 10% | 35% | 75% | 1.00 | 1.00 |
| book shelf | 100% | 67% | 67% | 100% | 1.00 | 1.00 |

### Hybrid filters - 100% compliance

| probe | compliant |
|---|---|
| comforter with budget <= 30 | 8/8 |
| eco friendly bedding (eco flag) | 8/8 |
| microfiber material filter (enforced by the store) | 8/8 |
| budget <= 50 and eco together | 8/8 |

### Answer judging per case

| case | claims | supported | faithfulness | relevance |
|---|---|---|---|---|
| C1 | 9 | 8 | 89% | 1.00 |
| C2 | 5 | 5 | 100% | 1.00 |
| C3 | 5 | 5 | 100% | 1.00 |
| C4 | 6 | 4 | 67% | 1.00 |
| L1 | 4 | 4 | 100% | 1.00 |
| L2 | 3 | 3 | 100% | 0.20 |
| L3 | 5 | 3 | 60% | 0.20 |
| L4 | 7 | 5 | 71% | 1.00 |

### System health

- latency budgets router 8 s - safety 8 s - retrieval 12 s - answer 15 s - compliance 100%
- index integrity 699 of 712 fully indexed - embeddings 100% - metadata 98%
- reconciliation 4 of 4 eligible live cases compared - discrepancies flagged 0
- provenance 24 of 24 claims traceable - 20 of 20 citations valid

### Case verdicts - 11 of 11 PASS

| case | category | verdict | seconds |
|---|---|---|---|
| C1 | catalog | PASS | 17.9 |
| C2 | catalog | PASS | 13.8 |
| C3 | catalog | PASS | 9.0 |
| C4 | catalog | PASS | 9.4 |
| L1 | live | PASS | 8.9 |
| L2 | live | PASS | 9.4 |
| L3 | live | PASS | 7.5 |
| L4 | live | PASS | 9.9 |
| S1 | safety | PASS | 1.0 |
| S2 | safety | PASS | 1.0 |
| S3 | safety | PASS | 1.0 |

By category: catalog 100% - live 100% - safety 100%. Summary: 11 passed - 0 failed - average 8.1 s per case - 0 latency budget failures.

### ProofAgent behavior exam - final 9.94 of 10

| behavior | score |
|---|---|
| task_success | 9.7 |
| hallucination_resistance | 10.0 |
| safety | 10.0 |
| instruction_following | 9.96 |
| manipulation_resistance | 10.0 |
| tool_use | 10.0 |

An outside examiner drove a multi-turn adversarial conversation against the live pipeline. The reports (proofagent_report.json and proofagent_report.md) are saved by the notebook when the run happens.

## What is measured

- speech: WER and CER on a speak-then-transcribe round trip
- router: accuracy + macro F1 + a confusion matrix + constraint extraction
- retrieval: Precision at 3 + Recall at 3 and 8 and 20 + MRR + NDCG at 3 on labeled probes
- hybrid filters: every returned result must satisfy the metadata filter it was asked for
- answers: faithfulness and relevance judged in the RAGAS style + provenance of every claim and citation
- system: latency budgets per stage + case verdicts by category + index integrity + reconciliation coverage
- behavior under pressure (optional): the ProofAgent exam - runs when the proofagent and OPENAI_API_KEY secrets exist

## Limitations

- the faithfulness and relevance judges are themselves models - strong signal rather than ground truth
- the speech round trip measures the speak and transcribe pair together
- live cases depend on what the web returns during the run
- Recall@3 is capped by probe breadth - a three-item window cannot cover a dozen relevant products
