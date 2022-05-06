# Feature engineering pipeline

> *Note:* This `README.md` was generated using `Kedro 0.18.0` for illustration purposes. Please modify it according to your pipeline structure and contents.

This pipeline creates features from two different sources:

* Static features - Features that already exist at the primary layer and just need to be plucked and managed in their own table.
* Derived feature -  Where parametrised operations create new features by combining two columns.

> Look out for the '🟨 ' in Kedro Viz it means that parameters are applied to this node. You can inspect them on the sidebar by clicking the node.

* The `joiner` node has been written in a way that it will keep inner joining an arbitrary sequence of pandas DataFrame objects into one single table. It will fail if the number of rows changes during this operation. This operation creates out `model_input_table` which will be fundamental to analytical components downstream.

## Visualisation

![ingestion](../../../../.tours/images/feature.png)
