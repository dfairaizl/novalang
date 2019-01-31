import React from 'React';
import vis from 'vis';

import UIkit from 'uikit';
import Icons from 'uikit/dist/js/uikit-icons';

// loads the Icon plugin
UIkit.use(Icons);

const Sidebar = () => {
  return (
    <div className='uk-container uk-padding-small uk-flex-left uk-flex-none nv-sidebar'>
      <ul className='uk-nav'>
        <li><a className='nv-graph-item' href='#'>Simple.nv 1-30-2019T13:18:00</a></li>
      </ul>
    </div>
  );
};

class Graph extends React.Component {
  componentDidMount () {
    let nodes = [{'id':'059fbf7f-3251-4feb-bf0a-17c12e5405a8','label':'module'},{'id':'a18219e1-7b75-4ad1-9c31-7d11392a1b44','label':'number_literal'},{'id':'ac4450be-e207-42ce-8a62-b389c6e4df02','label':'immutable_declaration'},{'id':'9f5063d1-b966-41ba-ab19-239515049638','label':'number_literal'},{'id':'0caba775-789b-4def-9438-6c6da61172b6','label':'immutable_declaration'},{'id':'87ed220e-0353-40ec-a5d5-c934e8d2eedf','label':'identifier'},{'id':'79a2a5d9-5e37-4e9e-8cfb-3ee1a0cdba9d','label':'identifier'},{'id':'f95e9096-7a55-4217-b273-b3b38a1286b5','label':'bin_op'},{'id':'e4f07b01-69c2-40cb-9d23-e06e97a3a001','label':'immutable_declaration'}];

    // create an array with edges
    const edges = [{'from':'059fbf7f-3251-4feb-bf0a-17c12e5405a8','to':'ac4450be-e207-42ce-8a62-b389c6e4df02','label':'sources','arrows':'to'},{'from':'059fbf7f-3251-4feb-bf0a-17c12e5405a8','to':'0caba775-789b-4def-9438-6c6da61172b6','label':'sources','arrows':'to'},{'from':'059fbf7f-3251-4feb-bf0a-17c12e5405a8','to':'e4f07b01-69c2-40cb-9d23-e06e97a3a001','label':'sources','arrows':'to'},{'from':'ac4450be-e207-42ce-8a62-b389c6e4df02','to':'a18219e1-7b75-4ad1-9c31-7d11392a1b44','label':'expression','arrows':'to'},{'from':'0caba775-789b-4def-9438-6c6da61172b6','to':'9f5063d1-b966-41ba-ab19-239515049638','label':'expression','arrows':'to'},{'from':'f95e9096-7a55-4217-b273-b3b38a1286b5','to':'87ed220e-0353-40ec-a5d5-c934e8d2eedf','label':'left','arrows':'to'},{'from':'f95e9096-7a55-4217-b273-b3b38a1286b5','to':'79a2a5d9-5e37-4e9e-8cfb-3ee1a0cdba9d','label':'right','arrows':'to'},{'from':'e4f07b01-69c2-40cb-9d23-e06e97a3a001','to':'f95e9096-7a55-4217-b273-b3b38a1286b5','label':'expression','arrows':'to'}];

    nodes = nodes.map((n) => {
      return Object.assign({}, {
        color: '#1e87f0',
        textColor: 'white'
      }, n);
    });


    const options = {};
    const data = {
      nodes: new vis.DataSet(nodes),
      edges: new vis.DataSet(edges)
    };

    this.network = new vis.Network(this.ref, data, options);
  }

  render () {
    return (
      <div
        className='uk-container uk-padding-small uk-flex-left uk-flex-1'
        ref={(ref) => { this.ref = ref; }}
      />
    );
  }
}

export default class App extends React.Component {
  render () {
    return (
      <div className='uk-flex uk-flex-column uk-height-1-1'>
        <div className='uk-flex-none'>
          <nav className='uk-navbar-container nv-navbar-container'>
            <a className='uk-navbar-item uk-logo nv-logo' href='#'>Nova-Lang ASG Debugger</a>
          </nav>
        </div>
        <div className='uk-flex-1'>
          <div className='uk-flex uk-height-1-1'>
            <Sidebar />
            <Graph />
          </div>
        </div>
      </div>
    );
  }
}
