'use strict';

const React = require('react');
const {
  Button,
  Form,
  Modal,
  Select,
  Icon,
  Input
} = require('semantic-ui-react');

const TaskSettingsModal = ({
  isOpen,
  onClose,
  sortBy,
  sortDirection,
  onSortChange,
  showCompleted,
  onShowCompletedChange,
  defaultDueTime,
  onDefaultDueTimeChange
}) => {
  return (
    <Modal size="small" open={isOpen} onClose={onClose}>
      <Modal.Header>Task Settings</Modal.Header>
      <Modal.Content>
        <Form>
          <Form.Field>
            <label>Default Due Time</label>
            <Input
              type="time"
              value={defaultDueTime}
              onChange={(e) => onDefaultDueTimeChange(e.target.value)}
              style={{ width: '150px' }}
            />
            <div style={{ marginTop: '0.5em', fontSize: '0.9em', color: 'rgba(0,0,0,0.6)' }}>
              This time will be used as the default when setting due dates for tasks
            </div>
          </Form.Field>
          <Form.Field>
            <label>Sort By</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1em' }}>
              <Select
                fluid
                value={sortBy}
                onChange={(e, data) => onSortChange(data.value)}
                options={[
                  { key: 'created_at', text: 'Creation Date', value: 'created_at' },
                  { key: 'due_date', text: 'Due Date', value: 'due_date' },
                  { key: 'completed_at', text: 'Completion Date', value: 'completed_at' }
                ]}
              />
              <Button
                icon
                onClick={() => onSortChange(sortBy)}
                style={{ marginLeft: '0.5em' }}
              >
                <Icon name={sortDirection === 'asc' ? 'sort ascending' : 'sort descending'} />
              </Button>
            </div>
          </Form.Field>
          <Form.Field>
            <label>Display Options</label>
            <Form.Checkbox
              label="Show completed tasks"
              checked={showCompleted}
              onChange={(e, data) => onShowCompletedChange(data.checked)}
            />
          </Form.Field>
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose}>
          Close
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

module.exports = TaskSettingsModal; 