import React, { useEffect, useState } from 'react'
import {
    Button,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
    StyleSheet,
    TouchableOpacity
  } from 'react-native'

import { API, graphqlOperation } from 'aws-amplify'
import { createTodo } from './src/graphql/mutations'
import { listTodos } from './src/graphql/queries'

const initialState = { name: '', description: '', showForm: false }

const App = () => {
  const [formState, setFormState] = useState(initialState)
  const [todos, setTodos] = useState([])

  useEffect(() => {
    fetchTodos()
  }, [])

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value })
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos));
      const todos = todoData.data.listTodos.items
      setTodos(todos)
    } catch (err) { console.log('error fetching todos') }
  }

  async function addTodo() {
    try {
      const todo = { ...formState }
      setTodos([...todos, todo])
      setFormState(initialState)
      await API.graphql(graphqlOperation(createTodo, {input: todo}))
    } catch (err) {
      console.log('error creating todo:', err)
    }
  }

  return (
    <SafeAreaView>
      <StatusBar />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic" >
        {formState.showForm &&
          <View style={styles.container}>
            <Text style={styles.title}>New ToDo</Text>
            <TextInput
              onChangeText={val => setInput('name', val)}
              style={styles.input,styles.textInput}
              value={formState.name}
              placeholder="Name"
            />
            <TextInput
              onChangeText={val => setInput('description', val)}
              style={styles.input, styles.multilineInput}
              value={formState.description}
              multiline={true}
              numberOfLines={10}
              placeholder="Description"
            />
            <TouchableOpacity style={styles.button} onPress={addTodo} >
              <Text style={styles.buttonText}>Create Todo</Text>
            </TouchableOpacity>
            <Button title="Cancel" onPress={async () => {
              setFormState({ showForm: false });
            }} color='#333' />
          </View>
        }
        {!formState.showForm &&
          <View style={styles.container}>
            <TouchableOpacity style={[styles.button, { marginTop: -25 }]} onPress={async () => {
              setFormState({ showForm: true, message: undefined });
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
})

export default  App 