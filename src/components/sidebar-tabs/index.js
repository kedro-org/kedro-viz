import React from 'react';
import { connect } from 'react-redux';
import { Tabs } from '@quantumblack/carbon-ui-components';
import ChartUI from '../chart-ui';
import History from '../history';
import './sidebar-tabs.css';

const tabData = [
  {
    text: 'Options',
    href: '#options',
    content: ChartUI
  },
  {
    text: 'Snapshots',
    href: '#snapshots',
    content: History
  }
];

class SidebarTabs extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedIndex: 0
    };

    this._selectedTabChanged = this._selectedTabChanged.bind(this);
  }

  _selectedTabChanged(e, { selectedIndex, href }) {
    this.setState({ selectedIndex }, () => {
      this.tabs.querySelector(href).focus();
    });
  }

  render() {
    const { selectedIndex } = this.state;

    if (!this.props.showHistory) {
      return (
        <div className='pipeline-tabs'>
          <div className='pipeline-tabs_tab'>
            <ChartUI />
          </div>
        </div>
      );
    }
  
    return (
      <div className='pipeline-tabs' ref={el => { this.tabs = el; }}>
        <Tabs
          onSelect={this._selectedTabChanged}
          selectedIndex={selectedIndex}
          size='small'
          tabs={tabData}
          theme='light' />
        {
          tabData.map((tab, i) => (
            <div
              className='pipeline-tabs_tab'
              aria-labelledby={`tab-${tab.text.toLowerCase()}`}
              hidden={selectedIndex !== i}
              id={tab.text.toLowerCase()}
              key={tab.text}
              style={{ display: selectedIndex === i ? 'block' : 'none' }}
              tabIndex='-1'>
              <tab.content />
            </div>
          ))
        }
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  showHistory: state.showHistory,
});

export default connect(mapStateToProps)(SidebarTabs);
