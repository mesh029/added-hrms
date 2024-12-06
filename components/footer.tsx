// Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  const footerStyle: React.CSSProperties = {
    backgroundColor: '#003366', // Dark blue
    color: 'white',
    padding: '20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const footerLinksStyle: React.CSSProperties = {
    margin: '10px 0',
    display: 'flex',
    flexWrap: 'wrap', // Allow wrapping for small screens
    justifyContent: 'center',
  };

  const footerLinkStyle: React.CSSProperties = {
    color: '#ffcc00', // Bright yellow for contrast
    margin: '0 15px',
    textDecoration: 'none',
    transition: 'color 0.3s',
  };

  const footerDescriptionStyle: React.CSSProperties = {
    margin: '5px 0',
    fontSize: '14px',
  };

  const copyrightStyle: React.CSSProperties = {
    fontSize: '12px',
    marginTop: '10px',
  };

  return (
    <footer style={footerStyle}>
      <p style={footerDescriptionStyle}>
        PATH - Your partner in innovative solutions.
      </p>
      <div style={footerLinksStyle}>
        <a style={footerLinkStyle} href="#home">Home</a>
        <a style={footerLinkStyle} href="#solutions">Solutions</a>
        <a style={footerLinkStyle} href="#about">About Us</a>
        <a style={footerLinkStyle} href="#blog">Blog</a>
        <a style={footerLinkStyle} href="#contact">Contact</a>
      </div>
      <p style={copyrightStyle}>
        © {new Date().getFullYear()} PATH. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
