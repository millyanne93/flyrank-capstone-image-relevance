import { createPost } from '../src/repositories/posts.repository';
import { closePool } from '../src/db/client';

const samplePosts = [
    {
        title: 'The Behavior of Red Foxes',
        body: 'Red foxes (Vulpes vulpes) are highly adaptable mammals found across the Northern Hemisphere. They are known for their distinctive red-orange fur, bushy tail, and clever hunting strategies. Foxes are solitary hunters that prey on small mammals, birds, and insects.',
        category: 'animal'
    },
    {
        title: 'Wolf Pack Dynamics',
        body: 'Gray wolves (Canis lupus) are social predators that live in family groups called packs. A typical wolf pack consists of an alpha pair, their offspring, and occasionally other relatives. Wolves are apex predators that play a crucial role in maintaining ecosystem balance.',
        category: 'animal'
    },
    {
        title: 'Understanding Dog Behavior',
        body: 'Domestic dogs (Canis familiaris) are the most diverse mammal species, with hundreds of breeds. They are highly social animals that have evolved alongside humans for thousands of years. Dogs are known for their loyalty, trainability, and ability to understand human emotions.',
        category: 'animal'
    },
    {
        title: 'The Life of Bears',
        body: 'Bears are large mammals found across North America, Europe, and Asia. They are omnivores with varied diets that include berries, fish, and small mammals. Bears are generally solitary animals, except for mothers with cubs.',
        category: 'animal'
    },
    {
        title: 'Deer in the Wild',
        body: 'Deer are hooved mammals found on every continent except Antarctica. They are herbivores that feed on grass, leaves, and twigs. Male deer grow antlers that are shed and regrown each year.',
        category: 'animal'
    },
    {
        title: 'Wildlife Conservation Efforts',
        body: 'Wildlife conservation is the practice of protecting animal species and their habitats. It involves efforts to prevent species extinction, restore ecosystems, and maintain biodiversity. Conservation programs include habitat protection, captive breeding, and anti-poaching initiatives.',
        category: 'animal'
    }
];

async function createPosts() {
    console.log(' Creating sample posts...\n');

    for (const postData of samplePosts) {
        try {
            const post = await createPost(
                postData.title,
                postData.body,
                postData.category
            );
            console.log(` Created post: "${post.title}" (${post.id})`);
        } catch (error) {
            console.error(` Failed to create post "${postData.title}":`, error);
        }
    }

    console.log('\n All posts created!');
    await closePool();
}

createPosts().catch(console.error);
