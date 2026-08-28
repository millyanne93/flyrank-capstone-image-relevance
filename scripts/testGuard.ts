import { evaluateMatch, MatchCandidate } from '../src/services/mismatchGuard.service';
import { config } from '../src/config';

function testGuard() {
    console.log('Testing Mismatch Guard (No API Required)\n');

    console.log('Test Case 1: Fox post → Fox image');
    const foxCandidate: MatchCandidate = {
        image_id: 'fox-001',
        subject: 'red fox',
        category: 'animal',
        caption: 'A red fox standing in a forest',
        confidence: 0.95,
        similarity_score: 0.85,
    };
    const result1 = evaluateMatch('animal', 'The Behavior of Red Foxes', foxCandidate);
    console.log(`   Result: ${result1.accepted ? 'ACCEPTED' : ' REJECTED'}`);
    if (!result1.accepted) console.log(`   Reason: ${result1.reason}`);
    console.log('');

    console.log('Test Case 2: Fox post → Wolf image');
    const wolfCandidate: MatchCandidate = {
        image_id: 'wolf-001',
        subject: 'gray wolf',
        category: 'animal',
        caption: 'A gray wolf in the forest',
        confidence: 0.94,
        similarity_score: 0.72,
    };
    const result2 = evaluateMatch('animal', 'The Behavior of Red Foxes', wolfCandidate);
    console.log(`   Result: ${result2.accepted ? 'ACCEPTED' : ' REJECTED'}`);
    if (!result2.accepted) console.log(`   Reason: ${result2.reason}`);
    console.log('');

    
    console.log('Test Case 3: Fox post → Dog image');
    const dogCandidate: MatchCandidate = {
        image_id: 'dog-001',
        subject: 'golden retriever',
        category: 'animal',
        caption: 'A golden retriever dog',
        confidence: 0.96,
        similarity_score: 0.58,
    };
    const result3 = evaluateMatch('animal', 'The Behavior of Red Foxes', dogCandidate);
    console.log(`   Result: ${result3.accepted ? 'ACCEPTED' : ' REJECTED'}`);
    if (!result3.accepted) console.log(`   Reason: ${result3.reason}`);
    console.log('');

    console.log('Test Case 4: Plant post → Animal image');
    const plantCandidate: MatchCandidate = {
        image_id: 'bear-001',
        subject: 'polar bear',
        category: 'animal',
        caption: 'A polar bear on ice',
        confidence: 0.98,
        similarity_score: 0.45,
    };
    const result4 = evaluateMatch('plant', 'The Life of Oak Trees', plantCandidate);
    console.log(`   Result: ${result4.accepted ? 'ACCEPTED' : ' REJECTED'}`);
    if (!result4.accepted) console.log(`   Reason: ${result4.reason}`);
    console.log('');

   
    console.log('Test Case 5: Similarity too low');
    const lowSimCandidate: MatchCandidate = {
        image_id: 'bear-002',
        subject: 'grizzly bear',
        category: 'animal',
        caption: 'A grizzly bear in the wild',
        confidence: 0.97,
        similarity_score: 0.35,
    };
    const result5 = evaluateMatch('animal', 'The Behavior of Red Foxes', lowSimCandidate);
    console.log(`   Result: ${result5.accepted ? 'ACCEPTED' : 'REJECTED'}`);
    if (!result5.accepted) console.log(`   Reason: ${result5.reason}`);
    console.log('');

    console.log('All guard tests completed!');
}

testGuard()
