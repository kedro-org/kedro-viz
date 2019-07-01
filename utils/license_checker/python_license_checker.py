#!/usr/bin/env python
# -*- coding: utf-8 -*-

# Copyright 2018-2019 QuantumBlack Visual Analytics Limited
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
# The QuantumBlack Visual Analytics Limited ("QuantumBlack”) name and logo
# (either separately or in combination, "QuantumBlack Trademarks”) are
# trademarks of QuantumBlack. The License does not grant you any right or
# license to the QuantumBlack Trademarks. You may not use the QuantumBlack
# Trademarks or any confusingly similar mark as a trademark for your product,
#     or use the QuantumBlack Trademarks in any other manner that might cause
# confusion in the marketplace, including but not limited to in advertising,
# on websites, or on software.
#
# See the License for the specific language governing permissions and
# limitations under the License."


import json
import subprocess
import sys
from pathlib import Path
from typing import List, Mapping, Union

WHITELISTED_PACKAGES_FILE = "python_package_whitelist.json"

LICENSE_WHITELIST = (
    "APACHE 2.0",
    "APACHE LICENSE 2.0",
    "APACHE LICENSE VERSION 2.0",
    "APACHE LICENSE, VERSION 2.0",
    "BSD",
    "BSD 2-CLAUSE",
    "BSD LICENSE",
    "BSD-3-CLAUSE",
    "BSD-LIKE",
    "ISC LICENSE",
    "MIT",
    "MIT LICENSE",
    "OSI APPROVED :: BSD LICENSE",
    "NEW BSD LICENSE",
)

here = Path(__file__).parent


def get_license_data() -> List[Mapping[str, str]]:
    """Run `pip-license` and return packages license data"""
    output = subprocess.check_output(["pip-licenses", "--format", "json"])
    return json.loads(output)


def get_whitelisted_packages() -> Mapping[str, Union[str, None]]:
    """Get and return list of upper-cased whitelisted packages/licenses in
    `WHITELISTED_PACKAGES_FILE`"""
    with (here / WHITELISTED_PACKAGES_FILE).open() as fh:
        package_data = json.load(fh)
    return {
        key.upper().strip(): val.upper().strip() if val else val
        for key, val in package_data.items()
    }


def get_problematic_packages(
    package_data: List[Mapping[str, str]]
) -> List[Mapping[str, str]]:
    """Filter for package_data containing problematic packages"""
    white_listed_packages = get_whitelisted_packages()
    problematic_packages = []
    for p in package_data:
        license_name_upper = p["License"].upper()
        package_name_upper = p["Name"].upper()
        if (
            license_name_upper not in LICENSE_WHITELIST
            and package_name_upper not in white_listed_packages
        ):
            problematic_packages.append(p)
        elif (
            package_name_upper in white_listed_packages
            and white_listed_packages[package_name_upper]
            and white_listed_packages[package_name_upper] != license_name_upper
        ):
            problematic_packages.append(p)

    return problematic_packages


def main() -> int:
    all_package_data = get_license_data()
    problematic_packages = get_problematic_packages(all_package_data)

    if problematic_packages:
        print("Found problematic packages:", file=sys.stderr)
        for p in problematic_packages:
            print(json.dumps(p, indent=4, sort_keys=True), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
