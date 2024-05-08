
# from kedro.pipeline import Pipeline, node
# from kedro.pipeline.modular_pipeline import pipeline


# def _get_generic_pipe() -> Pipeline:
#     return Pipeline([
#         node(
#             func=lambda x: x,
#             inputs="input_df",
#             outputs="output_df",
#         ),
#     ])


# def create_pipeline(**kwargs) -> Pipeline:
#     pipe = Pipeline([
#         pipeline(
#             pipe=_get_generic_pipe(),
#             inputs={"input_df": "input_to_processing"},
#             outputs={"output_df": "post_first_pipe"},
#             namespace="first_processing_step",
#         ),
#         pipeline(
#             pipe=_get_generic_pipe(),
#             inputs={"input_df": "post_first_pipe"},
#             outputs={"output_df": "output_from_processing"},
#             namespace="second_processing_step",
#         ),
#     ])
#     return pipeline(
#         pipe=pipe,
#         inputs="input_to_processing",
#         outputs="output_from_processing",
#         namespace="processing",
#     )


# # def create_pipeline(**kwargs) -> Pipeline:
# #     new_pipeline = pipeline(
# #         [
# #             node(lambda x: x,
# #                  inputs="dataset_in",
# #                  outputs="dataset_1",
# #                  name="step1"),
# #             node(lambda x: x,
# #                  inputs="dataset_1",
# #                  outputs="dataset_2",
# #                  name="step2"),
# #             node(lambda x: x,
# #                  inputs="dataset_2",
# #                  outputs="dataset_3",
# #                  name="step3"),
# #             node(lambda x: x,
# #                  inputs="dataset_3",
# #                  outputs="dataset_out",
# #                  name="step4"
# #             )
# #         ],
# #             namespace="main_pipeline",
# #         inputs=None,
# #         outputs={"dataset_out", "dataset_3"}
# #     )
# #     return new_pipeline

# # def create_pipeline(**kwargs) -> Pipeline:

# #     sub_pipeline = pipeline(
# #         [
# #             node(lambda x: x,
# #                  inputs="dataset_1",
# #                  outputs="dataset_2",
# #                  name="step2"),
# #             node(lambda x: x,
# #                  inputs="dataset_2",
# #                  outputs="dataset_3",
# #                  name="step3"),
# #         ],
# #         inputs={"dataset_1"},
# #         outputs={"dataset_3"},
# #         namespace="sub_pipeline"
# #     )
# #     new_pipeline = pipeline(
# #         [
# #             node(lambda x: x,
# #                  inputs="dataset_in",
# #                  outputs="dataset_1",
# #                  name="step1"),
# #             sub_pipeline,
# #             node(lambda x: x,
# #                  inputs="dataset_1",
# #                  outputs="dataset_1_2",
# #                  name="step1_2"),
# #             node(lambda x: x,
# #                  inputs="dataset_3",
# #                  outputs="dataset_4",
# #                  name="step4"
# #             )
# #         ],
# #             namespace="main_pipeline",
# #         inputs=None,
# #         outputs={"dataset_3","dataset_4"}
# #     )
# #     return new_pipeline


# # def create_pipeline(**kwargs) -> Pipeline:

# #     sub_pipeline = pipeline(
# #         [
# #             node(lambda x: x,
# #                  inputs="dataset_1",
# #                  outputs="dataset_2",
# #                  name="step2"),
# #             node(lambda x: x,
# #                  inputs="dataset_2",
# #                  outputs="dataset_3",
# #                  name="step3"),
# #         ],
# #         inputs={"dataset_1"},
# #         outputs={"dataset_3"},
# #         namespace="sub_pipeline"
# #     )
# #     new_pipeline = pipeline(
# #         [
# #             node(lambda x: x,
# #                  inputs="dataset_in",
# #                  outputs="dataset_1",
# #                  name="step1"),
# #             sub_pipeline,
# #             node(lambda x: x,
# #                  inputs="dataset_1",
# #                  outputs="dataset_1_2",
# #                  name="step1_2"),
# #             node(lambda x: x,
# #                  inputs="dataset_3",
# #                  outputs="dataset_4",
# #                  name="step4"
# #             )
# #         ],
# #             namespace="main_pipeline",
# #         inputs=None,
# #         outputs={"dataset_3","dataset_4"}
# #     )

# #     other = pipeline([
# #         node(lambda x: x,
# #                  inputs="dataset_3",
# #                  outputs="dataset_5",
# #                  name="step5"
# #             )
# #     ],
# #     namespace="other_pipeline",
# #     inputs={"dataset_3"},
# #     outputs={"dataset_5"}
# #     )

# #     return new_pipeline + other

# # def create_pipeline(**kwargs) -> Pipeline:
# #     return pipeline(
# #         [
# #             node(
# #                 func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
# #                 inputs=["dataset_1", "dataset_2"],
# #                 outputs="dataset_3",
# #                 name="first_node",
# #             ),
# #             node(
# #                 func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
# #                 inputs=["dataset_3", "dataset_4"],
# #                 outputs="dataset_5",
# #                 name="second_node",
# #             ),
# #             node(
# #                 func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
# #                 inputs=["dataset_5", "dataset_6"],
# #                 outputs="dataset_7", 
# #                 name="third_node",
# #                 namespace="namespace_prefix_1",
# #             ),
# #             node(
# #                 func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
# #                 inputs=["dataset_7", "dataset_8"],
# #                 outputs="dataset_9",
# #                 name="fourth_node",
# #                 namespace="namespace_prefix_1",
# #             ),
# #             node(
# #                 func=lambda dataset_1, dataset_2: (dataset_1, dataset_2),
# #                 inputs=["dataset_9", "dataset_10"],
# #                 outputs="dataset_11",
# #                 name="fifth_node",
# #                 namespace="namespace_prefix_1",
# #             ),
# #         ]
# #     )

# # def create_pipeline(**kwargs) -> Pipeline:
# #     data_processing_pipeline = pipeline(
# #         [
# #             node(
# #                 lambda x: x,
# #                 inputs=["raw_data"],
# #                 outputs="model_inputs",
# #                 name="process_data",
# #                 tags=["split"],
# #             )
# #         ],
# #         namespace="uk.data_processing",
# #         outputs="model_inputs",
# #     )
# #     data_science_pipeline = pipeline(
# #         [
# #             node(
# #                 lambda x: x,
# #                 inputs=["model_inputs"],
# #                 outputs="model",
# #                 name="train_model",
# #                 tags=["train"],
# #             )
# #         ],
# #         namespace="uk.data_science",
# #         inputs="model_inputs",
# #     )
# #     return data_processing_pipeline + data_science_pipeline