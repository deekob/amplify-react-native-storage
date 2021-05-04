import React, { useEffect, useState } from 'react'
import {
  Button,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  Image,
  View,
  StyleSheet,
  TouchableOpacity
} from 'react-native'

import { API, graphqlOperation, Storage} from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react-native'
import {launchImageLibrary} from 'react-native-image-picker';
import uuid from 'react-native-uuid';
import { createTodo } from './src/graphql/mutations'
import { listTodos } from './src/graphql/queries'

const initialTodoState = { name: '', description: '', image: '' }
const initialAppState = {showForm: false, imageURI: '' }

const App = () => {
  const [todoState, setTodoState] = useState(initialTodoState)
  const [todos, setTodos] = useState([])
  const [appstate, setAppState] = useState(initialAppState)
  useEffect(() => {
    try{
      fetchTodos()
     } catch(err) {
      console.log("error in use effect")
     }
   }, [])


  function updateTodoState(key, value) {
    setTodoState({ ...todoState, [key]: value })
  }

  function updateAppState(key,value){
    setAppState({ ...appstate, [key]: value })
  }

  async function fetchTodos() {
    try {
      //fetch the recipes from the server
      const todoData = await API.graphql(graphqlOperation(listTodos));
      let todos = todoData.data.listTodos.items
      // for all todos get the pre-signURL and store in images field
      todos = await Promise.all(todos.map(async (todo) =>{
        const imageKey = await Storage.get(todo.image, { level: 'private' })
        console.log(imageKey)
        todo.image = imageKey;
        return todo;
      }));
      setTodos(todos)
      setTodoState(initialTodoState)
      setAppState(initialAppState)
    } catch (err) { console.log('error fetching todos ') + err }
  }

  async function addTodo() {
    try {
      // new code for images
      const photo = await fetch(appstate.imageURI)
      const photoBlob = await photo.blob();
      await Storage.put(todoState.image, photoBlob, {
        level: 'private',
        contentType: 'image/jpg'
      })

      //existing api code
      const todo = { ...todoState }
      setTodos([...todos, todo])
      await API.graphql(graphqlOperation(createTodo, { input: todo }))
      setTodoState(initialTodoState)
      setAppState(initialAppState)
     
    } catch (err) {
      console.log('error creating todo:', err)
    }
  }

  handleChoosePhoto = async () =>
   {
    try {
      launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 200,
        maxWidth: 200,
      }, (response) => {
        if (response.uri) {
          updateAppState( 'imageURI', response.uri )
          const filename = uuid.v4() + '_todoPhoto.jpg'
          updateTodoState('image', filename)
        }
      })
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <SafeAreaView>
      <StatusBar />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic" >
        {appstate.showForm &&
          <View style={styles.container}>
            <Text style={styles.title}>New ToDo</Text>
            <TextInput
              onChangeText={val => updateTodoState('name', val)}
              style={styles.input, styles.textInput}
              value={todoState.name}
              placeholder="Name"
            />
            <TextInput
              onChangeText={val => updateTodoState('description', val)}
              style={styles.input, styles.multilineInput}
              value={todoState.description}
              multiline={true}
              numberOfLines={10}
            placeholder="Description"
          />
          {appstate.imageURI == '' &&
            <TouchableOpacity style={styles.button} onPress={handleChoosePhoto}>
              <Text style={styles.buttonText}>Add Photo</Text>
            </TouchableOpacity>
          }
          {appstate.imageURI != '' &&
          <View style={styles.imageContainer}>
                <Image source={{ uri: appstate.imageURI }} style={styles.image} />
          </View>
          }
            <TouchableOpacity style={styles.button} onPress={addTodo} >
              <Text style={styles.buttonText}>Create Todo</Text>
            </TouchableOpacity>
            <Button title="Cancel" onPress={async () => {
              setAppState('showForm', false );
            }} color='#333' />
          </View>
        }
        {!appstate.showForm &&
          <View style={styles.container}>
            <TouchableOpacity style={[styles.button, { marginTop: -25 }]} onPress={async () => {
            updateAppState('showForm', true);
            }} >

              <Text style={styles.buttonText}>New To Do</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Your Todos</Text>
            {todos.length === 0 &&
              <View>
                <Text>You have no todos yet.</Text>
              </View>
            }
            {todos.length >= 0 &&
              todos.map((todo, index) => (
                <View key={todo.id ? todo.id : index} style={styles.todo}>
                  <Text style={styles.todoTitle}>{todo.name}</Text>
                  <Text style={styles.todoDescription}> {todo.description}</Text>
                  <Image source={{uri: todo.image}} style={styles.image}/>
                </View>
              ))
            }
          </View>
        }
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "#008000",
    padding: 10,
    marginBottom: 10
  },
  textInput: { height: 50 },
  multilineInput: { height: 200, textAlignVertical: 'top', },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#008000' },
  buttonText: { fontSize: 18, color: '#ffffff' },
  todoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#008000' },
  todoDescription: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  todo: { marginBottom: 15, padding: 10, borderColor: '#008000', borderStyle: 'solid', borderWidth: 1 },
  input: { height: 50, backgroundColor: '#ddd', marginBottom: 10, padding: 8 },
  image: { width: 200, height: 200 },  image: { width: 200, height: 200 },
  imageContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 10, flex: 1 }
})

export default withAuthenticator(App)