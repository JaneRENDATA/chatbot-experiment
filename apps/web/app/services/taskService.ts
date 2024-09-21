import { TASK_STATE_ENDPOINT, CHAT_BASE_URL } from '../../../../libs/shared/config/constants';

export const checkTaskState = async (taskId: string) => {

  /** 
   * Response structure: 
   * {
    "code": 1,
    "message": "Task encountered an error",
    "data": {
        "status": "error",
        "lib_id": null,
        "error": "Session is closed"
        }
   * }
   */
  const response = await fetch(`${CHAT_BASE_URL}${TASK_STATE_ENDPOINT}/${taskId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch task state');
  }

  return response.json();
};
