import { UseMutationResult, useMutation, useQueryClient } from "@tanstack/react-query";
import { postFetcher } from "../utils";
import notificationService from "../notificationService";

interface SetGuessPayload {
  playerId: string;
  guess: string;
}

interface SetGuessResponse {
  success: boolean;
  message?: string;
}

export const useSetGuess = () => {
  const queryClient = useQueryClient();

  const mutation: UseMutationResult<SetGuessResponse, Error, SetGuessPayload> = useMutation<
    SetGuessResponse,
    Error,
    SetGuessPayload
  >({
    mutationFn: (payload: SetGuessPayload) =>
      postFetcher(`${import.meta.env.VITE_API_BASE_URL}/guess`, {
        playerId: payload.playerId,
        guess: payload.guess
      }),
    onSuccess: () => {
      notificationService.emit('showAppNotification', {
        message: 'Guess saved successfully!',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('Guess failed:', error);
      notificationService.emit('showAppNotification', {
        message: error.message || 'Guess failed!',
        type: 'error',
      });
    },
    onSettled: (_data, _error, variables) => {
      if (variables?.playerId) {
        queryClient.invalidateQueries({ queryKey: ['player-status', variables.playerId] });
      }
    },
  });

  return mutation;
}
