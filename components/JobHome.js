'use strict';

const React = require('react');

const {
  Button,
  Header,
  Segment,
  Table
} = require('semantic-ui-react');

class JobHome extends React.Component {
  constructor (...props) {
    super(...props);

    this.settings = {
      ...this.props,
      state: {
        jobs: {}
      }
    };

    this._state = {
      content: this.settings.state
    };

    return this;
  }

  componentDidMount () {
    this.props.fetchResource();
  }

  render () {
    const { jobs } = this.props;
    return (
      <fabric-job-home class='fade-in'>
        <Segment>
          <Header as='h1'>Jobs</Header>
          <p>You can earn Bitcoin for contributing your node's compute resources to the network.</p>
        </Segment>
        <Segment>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Job</Table.HeaderCell>
                <Table.HeaderCell>Description</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {jobs && jobs.map((job) => (
                <Table.Row key={job.id}>
                  <Table.Cell>{job.name}</Table.Cell>
                  <Table.Cell>{job.description}</Table.Cell>
                  <Table.Cell>{job.status}</Table.Cell>
                  <Table.Cell>
                    <Button className='ui button' color='red'>Reject</Button>
                    <Button className='ui button'>Accept</Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Segment>
      </fabric-job-home>
    );
  }
}

module.exports = JobHome;
