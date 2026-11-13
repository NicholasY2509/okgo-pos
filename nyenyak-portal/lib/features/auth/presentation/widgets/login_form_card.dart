import 'package:flutter/material.dart';
import '../../../../core/theme/nyenyak_tokens.dart';
import '../../controllers/login_controller.dart';
import '../../models/login_credentials.dart';

/// Pure UI widget rendering the Email and Password login form card.
///
/// Consumes [LoginController] for submission state, password visibility,
/// and error surfacing.
class LoginFormCard extends StatefulWidget {
  const LoginFormCard({
    super.key,
    required this.controller,
    this.onLoginSuccess,
  });

  final LoginController controller;
  final VoidCallback? onLoginSuccess;

  @override
  State<LoginFormCard> createState() => _LoginFormCardState();
}

class _LoginFormCardState extends State<LoginFormCard> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();
  AutovalidateMode _autovalidateMode = AutovalidateMode.disabled;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    FocusScope.of(context).unfocus();
    widget.controller.clearError();

    final isValid = _formKey.currentState?.validate() ?? false;
    if (!isValid) {
      setState(() {
        _autovalidateMode = AutovalidateMode.onUserInteraction;
      });
      return;
    }

    final success = await widget.controller.submit(
      email: _emailController.text,
      password: _passwordController.text,
    );

    if (!mounted) {
      return;
    }

    if (success) {
      widget.onLoginSuccess?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListenableBuilder(
      listenable: widget.controller,
      builder: (context, _) {
        final isSubmitting = widget.controller.isSubmitting;
        final errorMessage = widget.controller.errorMessage;

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(NyenyakTokens.space6),
            child: Form(
              key: _formKey,
              autovalidateMode: _autovalidateMode,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Masuk',
                    style: theme.textTheme.titleLarge,
                  ),
                  const SizedBox(height: NyenyakTokens.space1),
                  Text(
                    'Masukkan email dan kata sandi Anda untuk masuk ke Nyenyak Portal.',
                    style: theme.textTheme.bodySmall?.copyWith(fontSize: 13.5),
                  ),
                  const SizedBox(height: NyenyakTokens.space6),
                  Text(
                    'Email',
                    style: theme.textTheme.labelLarge,
                  ),
                  const SizedBox(height: NyenyakTokens.space2),
                  TextFormField(
                    key: const Key('login_email_input'),
                    controller: _emailController,
                    focusNode: _emailFocusNode,
                    enabled: !isSubmitting,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autocorrect: false,
                    autofillHints: const [AutofillHints.email],
                    decoration: const InputDecoration(
                      hintText: 'nama@nyenyak.com',
                    ),
                    validator: LoginCredentials.validateEmail,
                    onChanged: (_) => widget.controller.clearError(),
                    onFieldSubmitted: (_) {
                      _passwordFocusNode.requestFocus();
                    },
                  ),
                  const SizedBox(height: NyenyakTokens.space4),
                  Text(
                    'Kata Sandi',
                    style: theme.textTheme.labelLarge,
                  ),
                  const SizedBox(height: NyenyakTokens.space2),
                  TextFormField(
                    key: const Key('login_password_input'),
                    controller: _passwordController,
                    focusNode: _passwordFocusNode,
                    enabled: !isSubmitting,
                    obscureText: widget.controller.obscurePassword,
                    textInputAction: TextInputAction.done,
                    autofillHints: const [AutofillHints.password],
                    decoration: InputDecoration(
                      hintText: 'Masukkan kata sandi',
                      suffixIcon: IconButton(
                        key: const Key('login_password_visibility_button'),
                        onPressed: isSubmitting
                            ? null
                            : widget.controller.togglePasswordVisibility,
                        tooltip: widget.controller.obscurePassword
                            ? 'Tampilkan kata sandi'
                            : 'Sembunyikan kata sandi',
                        icon: Icon(
                          widget.controller.obscurePassword
                              ? Icons.visibility_outlined
                              : Icons.visibility_off_outlined,
                          size: 20,
                        ),
                      ),
                    ),
                    validator: LoginCredentials.validatePassword,
                    onChanged: (_) => widget.controller.clearError(),
                    onFieldSubmitted: (_) => _handleSubmit(),
                  ),
                  if (errorMessage != null) ...[
                    const SizedBox(height: NyenyakTokens.space4),
                    Container(
                      key: const Key('login_error_banner'),
                      padding: const EdgeInsets.symmetric(
                        horizontal: NyenyakTokens.space3,
                        vertical: NyenyakTokens.space3,
                      ),
                      decoration: BoxDecoration(
                        color: NyenyakTokens.destructive.withValues(
                          alpha: 0.08,
                        ),
                        borderRadius: BorderRadius.circular(
                          NyenyakTokens.radiusMd,
                        ),
                        border: Border.all(
                          color: NyenyakTokens.destructive.withValues(
                            alpha: 0.25,
                          ),
                        ),
                      ),
                      child: Text(
                        errorMessage,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: NyenyakTokens.destructive,
                          fontWeight: FontWeight.w500,
                          fontSize: 13.0,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: NyenyakTokens.space6),
                  FilledButton(
                    key: const Key('login_submit_button'),
                    onPressed: isSubmitting ? null : _handleSubmit,
                    child: isSubmitting
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.2,
                              color: NyenyakTokens.primaryForeground,
                            ),
                          )
                        : const Text('Masuk'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

