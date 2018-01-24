module.exports = {

    'facebookAuth' : {
        'clientID'      : '1805773012829006', // your App ID
        'clientSecret'  : process.env.FACEBOOKSECRET, // your App Secret
        'callbackURL'   : 'https://vd1-bars.glitch.me/auth/facebook/callback',
        'profileURL'    : 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email',
        'profileFields' : ['id', 'email', 'name'] // For requesting permissions from Facebook API
    }
};
