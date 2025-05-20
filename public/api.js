export async function fetchRectangles() {
    try {
        const response = await fetch('/api/rectangles');
        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

export async function createRectangle(rectangleData) {
    try {
        const response = await fetch('/api/rectangles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rectangleData)
        });
        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

export async function updateRectangle(id, updates) {
    try {
        const response = await fetch(`/api/rectangles/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
        });
        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}

export async function deleteRectangle(id) {
    try {
        const response = await fetch(`/api/rectangles/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        throw error;
    }
}