const passport = require('passport');
const orm = require('../Database/dataBase.orm');
const { validationResult } = require('express-validator');

const authCtl = {};

// Register endpoint
authCtl.register = async (req, res, next) => {
    try {
        // Validar errores de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.apiError('Error', 400, errors.array());
        }

        passport.authenticate('local.Signup', (err, user, info) => {
            if (err) {
                return res.apiError('Error', 500);
            }
            if (!user) {
                return res.apiError('Error', 400);
            }
            
            // Login automático después del registro
            req.logIn(user, (err) => {
                if (err) {
                    return res.apiError('Error', 500);
                }
                
                return res.apiResponse({
                    user: {
                        id: user.idUser,
                        name: user.nameUsers,
                        email: user.emailUser,
                        username: user.userName
                    },
                    token: req.sessionID
                }, 201, 'Success');
            });
        })(req, res, next);
        
    } catch (error) {
        console.error('Registration error:', error);
        res.apiError('Error', 500);
    }
};

// Login endpoint
authCtl.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.apiError('Error', 400, errors.array());
        }

        passport.authenticate('local.Signin', (err, user, info) => {
            if (err) {
                return res.apiError('Error', 500);
            }
            if (!user) {
                return res.apiError('Error', 401);
            }
            
            req.logIn(user, (err) => {
                if (err) {
                    return res.apiError('Error', 500);
                }
                
                return res.apiResponse({
                    user: {
                        id: user.idUser,
                        name: user.nameUsers,
                        email: user.emailUser,
                        username: user.userName
                    },
                    token: req.sessionID
                }, 200, 'Success');
            });
        })(req, res, next);
        
    } catch (error) {
        console.error('Login error:', error);
        res.apiError('Error', 500);
    }
};

// Logout endpoint
authCtl.logout = (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.apiError('Error', 500);
        }
        req.session.destroy((err) => {
            if (err) {
                return res.apiError('Error', 500);
            }
            res.clearCookie('secureSessionId');
            return res.apiResponse(null, 200, 'Success');
        });
    });
};

// Get current user
authCtl.getProfile = (req, res) => {
    if (!req.isAuthenticated()) {
        return res.apiError('Error', 401);
    }
    
    const user = req.user;
    return res.apiResponse({
        user: {
            id: user.idUser,
            name: user.nameUsers,
            email: user.emailUser,
            username: user.userName
        }
    }, 200, 'Success');
};

module.exports = authCtl;
