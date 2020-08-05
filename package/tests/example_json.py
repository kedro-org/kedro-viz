# Copyright 2020 QuantumBlack Visual Analytics Limited
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
# NONINFRINGEMENT. IN NO EVENT WILL THE LICENSOR OR OTHER CONTRIBUTORS
# BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF, OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
# The QuantumBlack Visual Analytics Limited ("QuantumBlack") name and logo
# (either separately or in combination, "QuantumBlack Trademarks") are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
#     or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License.
# pylint: disable=protected-access
"""
Example JSON pipeline data.
"""

EXPECTED_PIPELINE_DATA = {
    "edges": [
        {"source": "7366ec9f", "target": "01a6a5cb"},
        {"source": "f1f1425b", "target": "01a6a5cb"},
        {"source": "01a6a5cb", "target": "60e68b8e"},
        {"source": "afffac5f", "target": "de8434b7"},
        {"source": "f1f1425b", "target": "de8434b7"},
        {"source": "de8434b7", "target": "37316e3a"},
        {"source": "7366ec9f", "target": "760f5b5e"},
        {"source": "f1f1425b", "target": "760f5b5e"},
        {"source": "760f5b5e", "target": "60e68b8e"},
        {"source": "60e68b8e", "target": "24d754e7"},
        {"source": "f1f1425b", "target": "24d754e7"},
    ],
    "layers": [],
    "nodes": [
        {
            "full_name": "func1",
            "id": "01a6a5cb",
            "name": "Func1",
            "pipelines": ["__default__", "third"],
            "tags": [],
            "type": "task",
        },
        {
            "full_name": "func2",
            "id": "de8434b7",
            "name": "my_node",
            "pipelines": ["__default__"],
            "tags": ["bob"],
            "type": "task",
        },
        {
            "full_name": "bob_in",
            "id": "7366ec9f",
            "layer": None,
            "name": "Bob In",
            "pipelines": ["__default__", "second", "third"],
            "tags": [],
            "type": "data",
        },
        {
            "full_name": "bob_out",
            "id": "60e68b8e",
            "layer": None,
            "name": "Bob Out",
            "pipelines": ["__default__", "second", "third"],
            "tags": [],
            "type": "data",
        },
        {
            "full_name": "fred_in",
            "id": "afffac5f",
            "layer": None,
            "name": "Fred In",
            "pipelines": ["__default__"],
            "tags": ["bob"],
            "type": "data",
        },
        {
            "full_name": "fred_out",
            "id": "37316e3a",
            "layer": None,
            "name": "Fred Out",
            "pipelines": ["__default__"],
            "tags": ["bob"],
            "type": "data",
        },
        {
            "full_name": "parameters",
            "id": "f1f1425b",
            "layer": None,
            "name": "Parameters",
            "pipelines": ["__default__", "second", "third"],
            "tags": ["bob"],
            "type": "parameters",
        },
        {
            "full_name": "func",
            "id": "760f5b5e",
            "name": "Func",
            "pipelines": ["second"],
            "tags": [],
            "type": "task",
        },
        {
            "full_name": "func1",
            "id": "24d754e7",
            "name": "Func1",
            "pipelines": ["second"],
            "tags": [],
            "type": "task",
        },
    ],
    "pipelines": [
        {"id": "__default__", "name": "Default"},
        {"id": "second", "name": "Second"},
        {"id": "third", "name": "Third"},
    ],
    "tags": [{"id": "bob", "name": "Bob"}],
}
