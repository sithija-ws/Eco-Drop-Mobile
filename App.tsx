import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type CardProps = {
  title: string;
  description: string;
  emoji: string;
};

function Card({ title, description, emoji }: CardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
    </View>
  );
}

export default function App() {
  return (
    <View style={styles.container}>
      <Card emoji="🚀" title="Fast" description="Built with native code" />
      <Card emoji="🎨" title="Pretty" description="Looks great everywhere" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emoji: { fontSize: 32 },
  title: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  desc: { fontSize: 14, color: '#64748b', marginTop: 4 },
});