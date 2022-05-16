# Reporting modular pipeline

> _Note:_ This `README.md` was generated using `Kedro 0.18.1` for illustration purposes. Please modify it according to your pipeline structure and contents.

The reporting pipeline provides 3 simple descriptive cuts from the `prm_shuttle_company_reviews` table:

| Plot name                     | Dataset type        | Description                                                                                                                                                                                                                                            | Image                                            |
| ----------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Cancellation Policy Breakdown | Plotly              | Provides a breakdown of the top countries by fleet price, broken down by flexible each of their cancellation policies are.                                                                                                                             | ![bar](../../../../.tours/images/bar_chart.png)  |
| Price histogram               | Plotly              | Provides a breakdown of how the different space shuttles compare from a price and scale point of view, broken down by engine type.                                                                                                                     | ![hist](../../../../.tours/images/histogram.png) |
| Cancellation Policy Grid      | Custom Pillow Image | This image is not something that we would really do in practice, but has been included mostly to show how easy it is in to define and use a [custom dataset](https://kedro.readthedocs.io/en/stable/07_extend_kedro/03_custom_datasets.html) in Kedro. | ![grid](../../../../.tours/images/grid.png)      |

## Visualisation

![ingestion](../../../../.tours/images/reporting.png)
