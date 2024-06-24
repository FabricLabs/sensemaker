'use strict';

const React = require('react');
const { useNavigate } = require('react-router-dom');

const withNavigate = (Component) => {
    return (props) => {
        const navigate = useNavigate();
        return <Component {...props} navigate={navigate} />;
    };
};

module.exports = withNavigate;