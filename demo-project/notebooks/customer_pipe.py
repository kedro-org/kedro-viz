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

    load_customers_pipeline = pipeline([
        node(load_customers, None, "raw_customers", name="load_customers"),
    ])

    NotebookVisualizer(load_customers_pipeline).show()
    return (
        NotebookVisualizer,
        load_customers,
        load_customers_pipeline,
        node,
        pipeline,
    )


@app.cell
def _(NotebookVisualizer, load_customers_pipeline, node, pipeline):
    # Step 2: Clean Customer Data
    # Content: Now we add a node to clean the data (e.g., remove missing names).

    def clean_customers(data):
        return [c for c in data if c["name"]]

    clean_customers_pipeline = load_customers_pipeline + pipeline([node(clean_customers, "raw_customers", "cleaned_customers", name="clean_customers"),])

    NotebookVisualizer(clean_customers_pipeline).show()
    return clean_customers, clean_customers_pipeline


@app.cell
def _(NotebookVisualizer, clean_customers_pipeline, node, pipeline):
    # Step 3: Enrich Customers with Geolocation
    # Content: We simulate loading geolocation info and enrich customer records using it.

    def enrich_customers(customers, geo_data):
        for c in customers:
            c["location"] = geo_data.get(c["id"], "Unknown")
        return customers

    def load_geo_data():
        return {1: "NY", 2: "CA"}

    enrich_customers_pipeline = clean_customers_pipeline + pipeline([
        node(load_geo_data, None, "geo_data", name="load_geo_data"),
        node(enrich_customers, ["cleaned_customers", "geo_data"], "enriched_customers", name="enrich_customers"),
    ])

    NotebookVisualizer(enrich_customers_pipeline).show()
    return enrich_customers, enrich_customers_pipeline, load_geo_data


@app.cell
def _(NotebookVisualizer, enrich_customers_pipeline, node, pipeline):
    # Step 4: Compute Summary Statistics
    # Content: We compute simple stats on the enriched dataset.

    def compute_stats(data):
        return {"count": len(data)}

    compute_stats_pipeline = enrich_customers_pipeline + pipeline([node(compute_stats, "enriched_customers", "customer_stats", name="compute_stats")])

    NotebookVisualizer(compute_stats_pipeline).show()
    return compute_stats, compute_stats_pipeline


@app.cell
def _(NotebookVisualizer, compute_stats_pipeline, node, pipeline):
    # Step 5: Generate a Report
    # Content: The final node turns stats into a human-readable report.

    def generate_report(stats):
        return f"Report: Total customers = {stats['count']}"

    reporting_pipeline = compute_stats_pipeline + pipeline([node(generate_report, "customer_stats", "report", name="generate_report")])

    NotebookVisualizer(reporting_pipeline, options={
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
    return generate_report, reporting_pipeline

if __name__ == "__main__":
    app.run()
