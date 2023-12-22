'use strict';

// Dependencies
const React = require('react');

// Semantic UI
const {
    Button,
    Form,
    Message,
    Modal,
    Header
} = require('semantic-ui-react');

class PasswordResetModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            modalLoading: false,
            emailError: false,
            errorContent: '',
            tokenSent: false,
        };
    }

    handleSubmit = async (event) => {
        const { email } = this.state;
        event.preventDefault();

        const fetchPromise = fetch('/passwordReset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Email could not be sent. Please check your internet connection."));
            }, 15000);
        });

        try {
            this.setState({
                modalLoading: true,
                emailError: false,
                tokenSent: false,
            });

            const response = await Promise.race([timeoutPromise, fetchPromise]);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message);
            }

            //forced delay
            await new Promise((resolve) => setTimeout(resolve, 1500));

            this.setState({ tokenSent: true, modalLoading: false });

        } catch (error) {
            //forced delay
            await new Promise((resolve) => setTimeout(resolve, 1500));

            //handling the errors
            if (error.message) {
                this.setState({ emailError: true, errorContent: error.message });
            }
            this.setState({ modalLoading: false });
        }
    };

    handleInputChange = (event) => {
        this.setState({
            [event.target.name]: event.target.value
        });
    };

    handleCloseModal = () => {
        this.props.togglePasswordModal();
        this.setState({
            email: '',
            modalLoading: false,
            emailError: false,
            errorContent: '',
            tokenSent: false,
        });
    }

    render() {
        const { open } = this.props;
        const { modalLoading, tokenSent, emailError, errorContent, email } = this.state;

        return (
            <Modal
                open={open}
                size='mini'>
                <Modal.Header>
                    Password restore
                </Modal.Header>
                <Modal.Content>
                    {!tokenSent && (
                        <Modal.Description>
                            <p>Lost your password? Please enter your email address. We will send you a link to reset your password.</p>
                        </Modal.Description>
                    )
                    }
                    <Form onSubmit={this.handleSubmit} style={{ marginTop: '1em' }}>
                        {!tokenSent && (
                            <Form.Input
                                size='mini'
                                label='Email'
                                type='email'
                                name='email'
                                onChange={this.handleInputChange}
                                autoComplete="off"
                                vale={email}
                                required
                            />
                        )}
                        <Modal.Actions>
                            {emailError && (
                                <Message negative>
                                    <p>{errorContent}</p>
                                </Message>
                            )}
                            {tokenSent && (
                                <Message positive>
                                    <p>Please check your email. We've sent you an email with a link to reset your password.</p>
                                </Message>
                            )}
                            <Button
                                content='Close'
                                icon='close'
                                onClick={this.handleCloseModal}
                                size='small'
                                secondary
                            />
                            <Button
                                content='Submit'
                                icon='checkmark'
                                loading={modalLoading}
                                type='submit'
                                size='small'
                                primary
                                disabled={tokenSent}
                            />
                        </Modal.Actions>
                    </Form>
                </Modal.Content>
            </Modal>

        );
    }
}

module.exports = PasswordResetModal;
