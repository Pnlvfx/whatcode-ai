import type { BadRequestError, EffectHttpApiErrorBadRequest, InvalidRequestError, NotFoundError } from '@opencode-ai/sdk/v2';

export type OpencodeError = EffectHttpApiErrorBadRequest | InvalidRequestError | NotFoundError | BadRequestError;

export const opencodeError = (err: OpencodeError): Error => new Error(getOpencodeErrorMessage(err), { cause: err });

const getOpencodeErrorMessage = (err: OpencodeError): string => ('name' in err ? err.data.message : getRequestErrorMessage(err));

const getRequestErrorMessage = (err: EffectHttpApiErrorBadRequest | InvalidRequestError): string => {
  switch (err._tag) {
    case 'BadRequest':
      return 'Bad request';
    case 'InvalidRequestError':
      return err.message;
  }
};
