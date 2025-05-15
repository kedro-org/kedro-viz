export const statusMockData = {
    "nodes": {
        "69c523b6": {
            "name": "ingestion.apply_types_to_companies",
            "type": "task",
            "status": "success",
            "duration_sec": 0.020730291958898306,
            "error": null
        },
        "ea604da4": {
            "name": "ingestion.apply_types_to_reviews",
            "type": "task",
            "status": "success",
            "duration_sec": 0.016537458868697286,
            "error": null
        },
        "f33b9291": {
            "name": "ingestion.apply_types_to_shuttles",
            "type": "task",
            "status": "failed",
            "duration_sec": 0.04536341596394777,
            "error": null
        },
        "8de402c1": {
            "name": "ingestion.company_agg",
            "type": "task",
            "status": "success",
            "duration_sec": 0.6332297078333795,
            "error": null
        },
        "cb5166f3": {
            "name": "ingestion.combine_step",
            "type": "task",
            "status": "success",
            "duration_sec": 0.05509637505747378,
            "error": null
        },
        "04ba733a": {
            "name": "feature_engineering.create_derived_features([prm_spine_table;prm_shuttle_company_reviews;params:feature_engineering.feature.derived]) -> [feature_engineering.feat_derived_features]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.021556375082582235,
            "error": null
        },
        "7932e672": {
            "name": "feature_engineering.create_feature_importance([prm_spine_table]) -> [feature_importance_output]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.0043736661318689585,
            "error": null
        },
        "e50f81b8": {
            "name": "feature_engineering.create_static_features([prm_shuttle_company_reviews;params:feature_engineering.feature.static]) -> [feature_engineering.feat_static_features]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.021293167024850845,
            "error": null
        },
        "9a6ef457": {
            "name": "ingestion.<lambda>([prm_spine_table]) -> [ingestion.prm_spine_table_clone]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.004003250040113926,
            "error": null
        },
        "be6b7919": {
            "name": "reporting.create_matplotlib_chart([prm_shuttle_company_reviews]) -> [reporting.confusion_matrix]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.32629300002008677,
            "error": null
        },
        "44ef9b48": {
            "name": "reporting.get_top_shuttles_data([prm_shuttle_company_reviews]) -> [reporting.top_shuttle_data]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.020017917035147548,
            "error": null
        },
        "c7646ea1": {
            "name": "reporting.make_cancel_policy_bar_chart([prm_shuttle_company_reviews]) -> [reporting.cancellation_policy_breakdown]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.01677183387801051,
            "error": null
        },
        "3fb71518": {
            "name": "reporting.make_price_analysis_image([prm_shuttle_company_reviews]) -> [reporting.cancellation_policy_grid]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.01262691686861217,
            "error": null
        },
        "40886786": {
            "name": "reporting.make_price_histogram([prm_shuttle_company_reviews]) -> [reporting.price_histogram]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.1268374160863459,
            "error": null
        },
        "6ea2ec2c": {
            "name": "feature_engineering.joiner([prm_spine_table;feature_engineering.feat_static_features;feature_engineering.feat_derived_features]) -> [model_input_table]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.019039916805922985,
            "error": null
        },
        "4adb5c8b": {
            "name": "reporting.create_feature_importance_plot([feature_importance_output]) -> [reporting.feature_importance]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.0466410000808537,
            "error": null
        },
        "2816ba38": {
            "name": "split_data([model_input_table;params:split_options]) -> [X_train;X_test;y_train;y_test]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.017614749958738685,
            "error": null
        },
        "af9a43c8": {
            "name": "train_evaluation.linear_regression.train_model([X_train;y_train;params:train_evaluation.model_options.linear_regression]) -> [train_evaluation.linear_regression.regressor;train_evaluation.linear_regression.experiment_params]",
            "type": "task",
            "status": "failed",
            "duration_sec": 0.26918208389542997,
            "error": null
        },
        "038647c7": {
            "name": "train_evaluation.random_forest.train_model([X_train;y_train;params:train_evaluation.model_options.random_forest]) -> [train_evaluation.random_forest.regressor;train_evaluation.random_forest.experiment_params]",
            "type": "task",
            "status": "success",
            "duration_sec": 9.591613417025656,
            "error": null
        },
        "d2885635": {
            "name": "train_evaluation.linear_regression.evaluate_model([train_evaluation.linear_regression.regressor;X_test;y_test]) -> [train_evaluation.linear_regression.r2_score]",
            "type": "task",
            "status": "success",
            "duration_sec": 0.007663041818886995,
            "error": null
        },
        "bf8530bc": {
            "name": "train_evaluation.random_forest.evaluate_model([train_evaluation.random_forest.regressor;X_test;y_test]) -> [train_evaluation.random_forest.r2_score]",
            "type": "task",
            "status": "failed",
            "duration_sec": 0.13402137509547174,
            "error": null
        }
    },
    "datasets": {
        "aed46479": {
            "name": "companies",
            "load": {
                "time_sec": 0.037066583056002855,
                "size_bytes": 13998272,
                "count": 1
            },
            "save": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            }
        },
        "f23ad217": {
            "name": "ingestion.int_typed_companies",
            "load": {
                "time_sec": 0.17243408318609,
                "size_bytes": 6246118,
                "count": 1
            },
            "save": {
                "time_sec": 0.34521704190410674,
                "size_bytes": 6399158,
                "count": 1
            }
        },
        "7b2c6e04": {
            "name": "reviews",
            "load": {
                "time_sec": 0.04094683309085667,
                "size_bytes": 6167824,
                "count": 1
            },
            "save": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            }
        },
        "b5609df0": {
            "name": "params:ingestion.typing.reviews.columns_as_floats",
            "load": {
                "time_sec": 0.0009325831197202206,
                "size_bytes": 88,
                "count": 1
            },
            "save": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            }
        },
        "4f7ffa1b": {
            "name": "ingestion.int_typed_reviews",
            "load": {
                "time_sec": 0.007067374885082245,
                "size_bytes": 5355856,
                "count": 1
            },
            "save": {
                "time_sec": 0.024924000026658177,
                "size_bytes": 5355856,
                "count": 1
            }
        },
        "f1d596c2": {
            "name": "shuttles",
            "load": {
                "time_sec": 6.108836541883647,
                "size_bytes": 42831629,
                "count": 1
            },
            "save": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            }
        },
        "c0ddbcbf": {
            "name": "ingestion.int_typed_shuttles@pandas1",
            "load": {
                "time_sec": 0.01580791687592864,
                "size_bytes": 29647753,
                "count": 1
            },
            "save": {
                "time_sec": 0.07061466691084206,
                "size_bytes": 29647753,
                "count": 1
            }
        },
        "8f20d98e": {
            "name": "ingestion.prm_agg_companies",
            "load": {
                "time_sec": 0.003943250048905611,
                "size_bytes": 3920426,
                "count": 1
            },
            "save": {
                "time_sec": 0.007789874915033579,
                "size_bytes": 3920426,
                "count": 1
            }
        },
        "9f266f06": {
            "name": "prm_shuttle_company_reviews",
            "load": {
                "time_sec": 0.10767720802687109,
                "size_bytes": 16531446,
                "count": 7
            },
            "save": {
                "time_sec": 0.053217707900330424,
                "size_bytes": 16531446,
                "count": 1
            }
        },
        "f063cc82": {
            "name": "prm_spine_table",
            "load": {
                "time_sec": 0.020332374842837453,
                "size_bytes": 952592,
                "count": 4
            },
            "save": {
                "time_sec": 0.041543666971847415,
                "size_bytes": 952592,
                "count": 1
            }
        },
        "abed6a4d": {
            "name": "params:feature_engineering.feature.derived",
            "load": {
                "time_sec": 0.001136458944529295,
                "size_bytes": 88,
                "count": 1
            },
            "save": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            }
        },
        "7c92a703": {
            "name": "feature_engineering.feat_derived_features",
            "load": {
                "time_sec": 0.002108957851305604,
                "size_bytes": 714576,
                "count": 1
            },
            "save": {
                "time_sec": 0.0025545000098645687,
                "size_bytes": 714576,
                "count": 1
            }
        },
        "1e3cc50a": {
            "name": "feature_importance_output",
            "load": {
                "time_sec": 0.0027485410682857037,
                "size_bytes": 1259,
                "count": 1
            },
            "save": {
                "time_sec": 0.028953582979738712,
                "size_bytes": 1259,
                "count": 1
            }
        },
        "a3627e31": {
            "name": "params:feature_engineering.feature.static",
            "load": {
                "time_sec": 0.0010263330768793821,
                "size_bytes": 184,
                "count": 1
            },
            "save": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            }
        },
        "8e4f1015": {
            "name": "feature_engineering.feat_static_features",
            "load": {
                "time_sec": 0.005232334136962891,
                "size_bytes": 2470760,
                "count": 1
            },
            "save": {
                "time_sec": 0.00531395897269249,
                "size_bytes": 2470760,
                "count": 1
            }
        },
        "c08c7708": {
            "name": "ingestion.prm_spine_table_clone",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.002693040994927287,
                "size_bytes": 952592,
                "count": 1
            }
        },
        "3b199c6b": {
            "name": "reporting.confusion_matrix",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.11002254113554955,
                "size_bytes": 72,
                "count": 1
            }
        },
        "c0be8342": {
            "name": "reporting.top_shuttle_data",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.004115166841074824,
                "size_bytes": 120,
                "count": 1
            }
        },
        "d0e9b00f": {
            "name": "reporting.cancellation_policy_breakdown",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 2.9006974999792874,
                "size_bytes": 3151,
                "count": 1
            }
        },
        "8838ca1f": {
            "name": "reporting.cancellation_policy_grid",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.01104870904237032,
                "size_bytes": 48,
                "count": 1
            }
        },
        "c6992660": {
            "name": "reporting.price_histogram",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.028819415951147676,
                "size_bytes": 48,
                "count": 1
            }
        },
        "23c94afb": {
            "name": "model_input_table",
            "load": {
                "time_sec": 0.00796991609968245,
                "size_bytes": 2232744,
                "count": 1
            },
            "save": {
                "time_sec": 0.01895795902237296,
                "size_bytes": 2232744,
                "count": 1
            }
        },
        "eb7d6d28": {
            "name": "reporting.feature_importance",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.02041529188863933,
                "size_bytes": 48,
                "count": 1
            }
        },
        "22eec376": {
            "name": "params:split_options",
            "load": {
                "time_sec": 0.0009027498308569193,
                "size_bytes": 232,
                "count": 1
            },
            "save": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            }
        },
        "cae2d1c7": {
            "name": "X_train",
            "load": {
                "time_sec": 0.009488792391493917,
                "size_bytes": 1786066,
                "count": 2
            },
            "save": {
                "time_sec": 0.005398250184953213,
                "size_bytes": 1786066,
                "count": 1
            }
        },
        "872981f9": {
            "name": "X_test",
            "load": {
                "time_sec": 0.009693666826933622,
                "size_bytes": 446566,
                "count": 2
            },
            "save": {
                "time_sec": 0.004825707990676165,
                "size_bytes": 446566,
                "count": 1
            }
        },
        "9ca016a8": {
            "name": "y_train",
            "load": {
                "time_sec": 0.002501957817003131,
                "size_bytes": 381040,
                "count": 2
            },
            "save": {
                "time_sec": 0.001190457958728075,
                "size_bytes": 381040,
                "count": 1
            }
        },
        "f6d9538c": {
            "name": "y_test",
            "load": {
                "time_sec": 0.0022117909975349903,
                "size_bytes": 95280,
                "count": 2
            },
            "save": {
                "time_sec": 0.0010552089661359787,
                "size_bytes": 95280,
                "count": 1
            }
        },
        "98eb115e": {
            "name": "params:train_evaluation.model_options.linear_regression",
            "load": {
                "time_sec": 0.0008505829609930515,
                "size_bytes": 232,
                "count": 1
            },
            "save": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            }
        },
        "10e51dea": {
            "name": "train_evaluation.linear_regression.regressor",
            "load": {
                "time_sec": 0.001387750031426549,
                "size_bytes": 48,
                "count": 1
            },
            "save": {
                "time_sec": 0.06726916693150997,
                "size_bytes": 48,
                "count": 1
            }
        },
        "b701864d": {
            "name": "train_evaluation.linear_regression.experiment_params",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.0010767499916255474,
                "size_bytes": 232,
                "count": 1
            }
        },
        "72baf5c6": {
            "name": "params:train_evaluation.model_options.random_forest",
            "load": {
                "time_sec": 0.0007172499317675829,
                "size_bytes": 232,
                "count": 1
            },
            "save": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            }
        },
        "01675921": {
            "name": "train_evaluation.random_forest.regressor",
            "load": {
                "time_sec": 0.059549500001594424,
                "size_bytes": 48,
                "count": 1
            },
            "save": {
                "time_sec": 0.28545379219576716,
                "size_bytes": 48,
                "count": 1
            }
        },
        "4f79de77": {
            "name": "train_evaluation.random_forest.experiment_params",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.0010658751707524061,
                "size_bytes": 640,
                "count": 1
            }
        },
        "495a0bbc": {
            "name": "train_evaluation.linear_regression.r2_score",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.0010743748862296343,
                "size_bytes": 232,
                "count": 1
            }
        },
        "b16095d0": {
            "name": "train_evaluation.random_forest.r2_score",
            "load": {
                "time_sec": 0.0,
                "size_bytes": 0,
                "count": 0
            },
            "save": {
                "time_sec": 0.0010103329550474882,
                "size_bytes": 232,
                "count": 1
            }
        }
    },
    "pipeline": {
        "run_id": "bbfe98a2-2cb9-4933-9b32-0c407975a25e",
        "start_time": null,
        "end_time": null,
        "total_duration_sec": 11.410506376530975,
        "status": "completed"
    }
}