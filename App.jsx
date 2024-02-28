import react, {useEffect} from 'react';
import {Text, View} from 'react-native';
import StaticServer from 'react-native-static-server';
import RNFS from 'react-native-fs';
import {WebView} from 'react-native-webview';

const App = () => {
  useEffect(() => {
    // Path to the folder containing static files
    let path = RNFS.MainBundlePath + '/static_assets';

    // Creating a new server instance on port 8080
    let server = new StaticServer(8080, path);

    // Starting the server
    server.start().then(url => {
      console.log('Server started at ' + url);
    });
  });

  return (
    <View style={{flex: 1}}>
      <WebView
        source={{
          uri: 'http://localhost:8080/index.html',
        }}
      />
    </View>
  );
};

export default App;

//npx react-native run-ios --simulator='iPhone 15 Pro'
