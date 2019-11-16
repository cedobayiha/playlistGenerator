const clientId = '';

const redirectURI = 'http://localhost:3000/';

let accessToken;

const Spotify = {
  getAccessToken() {
    if (accessToken) {
      return accessToken;
    }
    // check for an access token match

    const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/)
    const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/)

    if (accessTokenMatch && expiresInMatch) {
      accessToken = accessTokenMatch[1];
      let expiresIn = Number(expiresInMatch[1]);
      // This clears the parameters, allowing us to grab a new access token when it expires.
      window.setTimeout(() => accessToken = '', expiresIn * 1000);
      window.history.pushState('Access Token', null, '/');
      return accessToken
    } else {
      const accessUrl =
        `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectURI}`;
      window.location = accessUrl;
    }
  },
  search(term) {
    let accessToken = Spotify.getAccessToken();
    console.log(accessToken)
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }).then(response => {
      return response.json();
    }).then(jsonResponse => {
      if (!jsonResponse.tracks) {
        return [];
      }
      return jsonResponse.tracks.items.map(track => {
        return {
          id: track.id,
          name: track.name,
          artists: track.artists[0].name,
          album: track.album.name,
          uri: track.uri
        }
      })

    });
  },

  savePlaylist(name, trackUris) {
    if (!name || !trackUris.lenght) {
      return;
    }
    const accessToken = Spotify.getAccessToken();
    console.log(accessToken)
    const headers = { Authorization: `Bearer ${accessToken}` }
    let userID;

    return fetch(`https://api.spotify.com/v1/me`, { headers: headers })
      .then(response => {
        return response.json()
      }).then(jsonResponse => {
        if (!jsonResponse.id) {
          return;
        } userID = jsonResponse.id;
        console.log(userID)
        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
          headers: headers,
          method: 'POST',
          body: JSON.stringify({ name: name })
        }).then(response => {
          return response.json();
        }).then(jsonResponse => {
          let playlistID = jsonResponse.id;
          console.log(playlistID)
          return fetch(`https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`, {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({ uris: trackUris })
          })
        })
      })
  }
}


export default Spotify;

