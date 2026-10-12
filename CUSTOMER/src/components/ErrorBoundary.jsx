import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          background: '#0d1117',
          color: '#e6edf3',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#cba358',
            marginBottom: '12px'
          }}>
            AMONTRON HOTEL & RESTAURANT
          </div>
          <h2 style={{ fontSize: '28px', margin: '0 0 16px', color: '#ffffff' }}>
            We Encountered an Unexpected Issue
          </h2>
          <p style={{ maxWidth: '500px', margin: '0 0 24px', color: '#8b949e', lineHeight: 1.6 }}>
            Something went wrong while rendering this section. Our hospitality team has been notified.
            Please return to our homepage or reload.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReload}
              style={{
                background: '#cba358',
                color: '#0d1117',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Return to Homepage
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                background: 'transparent',
                color: '#cba358',
                border: '1px solid #cba358',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
