# Data Ingestion modular pipeline

- This pipeline takes raw `companies`, `shuttles` and `reviews` data and creates typed parquet mirrors on the `intermediate` level.
- In order to create the `primary` domain level data, we aggregate the `companies` data so we have one row per company. We then merge all 3 sources and create two new `primary` tables:
  - The `prm_spine_table`  contains just the relevant ID columns at the required grain going forward. All `feature` and `model_input` tables will include these columns and have the same number rows.
  - The `prm_shuttle_company_reviews` table includes metrics which will be used later or in the pipeline as features ready to be used in the model.

## Visualisation

![ingestion](../../../../.tours/images/ingestion.png)  
