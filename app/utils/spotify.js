import { Linking, Alert } from 'react-native';
import { SPOTIFY_MOOD_PLAYLISTS } from './constants';

export const openMoodPlaylist = async (mood) => {
  const playlistId = SPOTIFY_MOOD_PLAYLISTS[mood];

  if (!playlistId || playlistId.startsWith('PLACEHOLDER')) {
    Alert.alert(
      'Playlist Not Set Up',
      `No Spotify playlist has been added for "${mood}" yet.`
    );
    return;
  }

  const appUri = `spotify:playlist:${playlistId}`;
  const webUrl = `https://open.spotify.com/playlist/${playlistId}`;

  try {
    const canOpenApp = await Linking.canOpenURL(appUri);

    if (canOpenApp) {
      await Linking.openURL(appUri);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.log('SPOTIFY OPEN ERROR:', error);
    Alert.alert('Error', 'Could not open Spotify.');
  }
};