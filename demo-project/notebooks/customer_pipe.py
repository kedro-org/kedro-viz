import marimo

__generated_with = "0.11.2"
app = marimo.App()


@app.cell
def _():
    # Step 1: Load Raw Customer Data
    # Content: We start by creating a simple node that loads raw customer data.

    from kedro.pipeline import pipeline, node 
    from kedro_viz.integrations.notebook import NotebookVisualizer 

    def load_customers():
        return [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}, {"id": 3}]

    pipeline_1 = pipeline([
        node(load_customers, None, "raw_customers", name="load_customers"),
    ])

    NotebookVisualizer(pipeline_1).show()
    return NotebookVisualizer, load_customers, node, pipeline, pipeline_1


@app.cell
def _(NotebookVisualizer, load_customers, node, pipeline):
    # Step 2: Clean Customer Data
    # Content: Now we add a node to clean the data (e.g., remove missing names).

    def clean_customers(data):
        return [c for c in data if c["name"]]

    pipeline_2 = pipeline([
        node(load_customers, None, "raw_customers", name="load_customers"),
        node(clean_customers, "raw_customers", "cleaned_customers", name="clean_customers"),
    ])

    NotebookVisualizer(pipeline_2).show()
    return clean_customers, pipeline_2


@app.cell
def _(NotebookVisualizer, clean_customers, load_customers, node, pipeline):
    # Step 3: Enrich Customers with Geolocation
    # Content: We simulate loading geolocation info and enrich customer records using it.

    def enrich_customers(customers, geo_data):
        for c in customers:
            c["location"] = geo_data.get(c["id"], "Unknown")
        return customers

    def load_geo_data():
        return {1: "NY", 2: "CA"}

    pipeline_3 = pipeline([
        node(load_customers, None, "raw_customers", name="load_customers"),
        node(clean_customers, "raw_customers", "cleaned_customers", name="clean_customers"),
        node(load_geo_data, None, "geo_data", name="load_geo_data"),
        node(enrich_customers, ["cleaned_customers", "geo_data"], "enriched_customers", name="enrich_customers"),
    ])

    NotebookVisualizer(pipeline_3).show()
    return enrich_customers, load_geo_data, pipeline_3


@app.cell
def _(
    NotebookVisualizer,
    clean_customers,
    enrich_customers,
    load_customers,
    load_geo_data,
    node,
    pipeline,
):
    # Step 4: Compute Summary Statistics
    # Content: We compute simple stats on the enriched dataset.

    def compute_stats(data):
        return {"count": len(data)}

    pipeline_4 = pipeline([
        node(load_customers, None, "raw_customers", name="load_customers"),
        node(clean_customers, "raw_customers", "cleaned_customers", name="clean_customers"),
        node(load_geo_data, None, "geo_data", name="load_geo_data"),
        node(enrich_customers, ["cleaned_customers", "geo_data"], "enriched_customers", name="enrich_customers"),
        node(compute_stats, "enriched_customers", "customer_stats", name="compute_stats"),
    ])

    NotebookVisualizer(pipeline_4).show()
    return compute_stats, pipeline_4


@app.cell
def _(
    NotebookVisualizer,
    clean_customers,
    compute_stats,
    enrich_customers,
    load_customers,
    load_geo_data,
    node,
    pipeline,
):
    # Step 5: Generate a Report
    # Content: The final node turns stats into a human-readable report.

    def generate_report(stats):
        return f"Report: Total customers = {stats['count']}"

    pipeline_5 = pipeline([
        node(load_customers, None, "raw_customers", name="load_customers"),
        node(clean_customers, "raw_customers", "cleaned_customers", name="clean_customers"),
        node(load_geo_data, None, "geo_data", name="load_geo_data"),
        node(enrich_customers, ["cleaned_customers", "geo_data"], "enriched_customers", name="enrich_customers"),
        node(compute_stats, "enriched_customers", "customer_stats", name="compute_stats"),
        node(generate_report, "customer_stats", "report", name="generate_report"),
    ])

    NotebookVisualizer(pipeline_5, options={
            "display": {
                "expandPipelinesBtn": True,
                "exportBtn": True,
                "labelBtn": True,
                "layerBtn": True,
                "miniMap": True,
                "sidebar": True,
                "zoomToolbar": True,
            },
            "expandAllPipelines": True,
            "behaviour": { 
                "reFocus": False,
            },
            "theme": "dark",
            "width": "100%",
            "height": "600px",   
        }).show()
    return generate_report, pipeline_5


if __name__ == "__main__":
    app.run()

