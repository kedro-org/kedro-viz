


Feature: Viz plugin in new project
    Background:
        Given I have prepared a config file with example code

    Scenario: Execute viz with Kedro 0.16.1
        Given I have installed kedro version "0.16.1"
        And I have run a non-interactive kedro new
        And I have executed the kedro command "install"
        When I execute the kedro viz command "viz"
        Then kedro-viz should start successfully

    Scenario: Execute viz with latest Kedro
        Given I have installed kedro version "latest"
        And I have run a non-interactive kedro new with pandas-iris starter
        And I have executed the kedro command "install"
        When I execute the kedro viz command "viz"
        Then kedro-viz should start successfully
