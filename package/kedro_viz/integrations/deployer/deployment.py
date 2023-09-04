from kedro.io.core import get_protocol_and_path
from kedro_viz.utils.api_tools import save_api_responses_to_fs
import fsspec 
from pathlib import Path

_HTML_DIR = Path(__file__).parent.parent.parent.absolute() / "html"


class S3Deployer:
    def __init__(self, region, bucket_name):
        self._region = region
        self._bucket_name = bucket_name
        self._protocol,self._path = get_protocol_and_path(bucket_name)
        self._remote = fsspec.filesystem(self._protocol)

    def _upload_api_responses(self):
        save_api_responses_to_fs(self._bucket_name)

    def _upload_static_files(self):
        source_files = [
        str(p)
        for p in _HTML_DIR.rglob("*")
        if p.is_file() and not p.name.endswith(".map")
        ]
        self._remote_fs.put(source_files, self._bucket_name)

    def _get_url(self):
        return f"http://{self._path}.s3-website.{self._region}.amazonaws.com"

    def deploy(self):
        self._upload_api_responses()
        self._upload_static_files()
        return self._get_url()
