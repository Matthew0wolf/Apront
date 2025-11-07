import React from 'react';

const AuthContext = React.createContext({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  setUser: () => {}
});

export default AuthContext;
