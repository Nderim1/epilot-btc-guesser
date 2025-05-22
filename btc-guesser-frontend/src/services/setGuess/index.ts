import { useMutation, UseMutationResult } from "@tanstack/react-query";
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
  const mutation: UseMutationResult<SetGuessResponse, Error, SetGuessPayload> = useMutation<
    SetGuessResponse,
    Error,
    SetGuessPayload
  >({
    mutationFn: (payload: SetGuessPayload) =>
      postFetcher(`https://d1d64qf74g.execute-api.eu-west-1.amazonaws.com/Prod/guess`, {
        playerId: payload.playerId,
        guess: payload.guess
      }),
    onSuccess: () => {
      notificationService.emit('showAppNotification', {
        message: 'Guess saved successfully!',
        type: 'success',
      });
    },
    onError: () => {
      notificationService.emit('showAppNotification', {
        message: 'Guess failed!',
        type: 'error',
      });
    },
  });

  return mutation;
}
