Feature: Viz plugin in new project
    Background:
        Given I have prepared a config file with example code

    Scenario: Execute viz with the earliest Kedro version that it supports 
        Given I have installed kedro version "0.18.3"
        And I have run a non-interactive kedro new with pandas-iris starter
        And I have installed the project's requirements
        When I execute the kedro viz run command
        Then kedro-viz should start successfully

    Scenario: Execute viz with latest Kedro with lower-bound viz requirements
        Given I have installed kedro version "latest"
        And I have installed the lower-bound Kedro-viz requirements
        And I have run a non-interactive kedro new with spaceflights-pandas starter
        And I have installed the project's requirements
        When I execute the kedro viz run command
        Then kedro-viz should start successfully
    
    Scenario: Execute viz with latest Kedro
        Given I have installed kedro version "latest"
        And I have run a non-interactive kedro new with spaceflights-pandas starter
        And I have installed the project's requirements
        When I execute the kedro viz run command
        Then kedro-viz should start successfully

    Scenario: Execute viz lite with the earliest Kedro version that it supports 
        Given I have installed kedro version "0.18.3"
        And I have run a non-interactive kedro new with pandas-iris starter
        When I execute the kedro viz run command with lite option
        Then kedro-viz should start successfully

    Scenario: Execute viz lite with latest Kedro
        Given I have installed kedro version "latest"
        And I have run a non-interactive kedro new with spaceflights-pandas starter
        When I execute the kedro viz run command with lite option
        Then kedro-viz should start successfully

    Scenario: Compare viz responses in regular and lite mode
        Given I have installed kedro version "latest"
        And I have run a non-interactive kedro new with spaceflights-pandas starter
        When I execute the kedro viz run command with lite option
        Then I store the response from main endpoint
        Given I have installed the project's requirements
        When I execute the kedro viz run command
        Then I compare the responses in regular and lite mode
