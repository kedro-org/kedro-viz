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

"""A module containing specifications for all callable hooks in the Kedro's execution timeline.
For more information about these specifications, please visit
[Pluggy's documentation](https://pluggy.readthedocs.io/en/stable/#specs)
"""
# pylint: disable=too-few-public-methods
from typing import Any, Dict

from kedro.framework.hooks.markers import hook_spec


class VizSpecs:
    """Namespace that defines all specifications for Kedro viz related hooks."""

    @hook_spec
    def after_api_data_ready(self, api_data: Dict[str, Any]) -> Dict[str, Any]:
        """Hook to be invoked after the Pipeline object has been formatted into a dictionary
        that will be shown by Kedro Viz.

        Args:
            api_data: the pipeline dictionary produced by format_pipeline_data.

        Returns:
            A dictionary containing the original pipeline data as well as any additional information
            added by plugins using this hook.
        """
        pass
