# Modelling pipeline

> _Note:_ This `README.md` was generated using `Kedro 0.18.1` for illustration purposes. Please modify it according to your pipeline structure and contents.

- This part of the pipeline handles the `spit` / `train` / `test` elements of the ML process.
- The `split_data` method is parametrised to create a single source of `train` and `test` data.
- We then use the modular pipeline pattern to instantiate two instances of our training and evaluation pipeline using two different Sklearn regressors (Random Forest, Linear Regression)
- In order to track experimentation over time, each model type will track 🧪 the hyper-parameters used as well as the R^2 score.

## Visualisation

![ingestion](../../../../.tours/images/modelling.png)
