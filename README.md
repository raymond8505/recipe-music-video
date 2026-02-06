# What?
Pass a URL to a recipe, get back a slideshow set to music inspired by that recipe.

# MIDI Generation

The prompt chain maps ingredients to chord progressions along with timing and other techniques to create a 3 act piece. The instructions are passed to a deterministic script that generates a MIDI file, which is then converted into a WAV using a given sound font. 

Transitions are timed to match the musical acts and techniques are used to create the emotional soundtrack for the slideshow... in theory...

I'm still studying up on music theory and narrative techniques

## WAV Conversion

- Uses fluidsynth to convert the MIDI into a wav ffmpeg can use

provide your own sf2 in the ENV var

also provide your own fluidsynth binary in `midi-generation/bin/fluidsynth`

# Slideshow Generation

Slides are generated for the slide show to tell the "story" of the dish's creation. 

The workflow takes the MIDI spec, then generates slides and generates "scenes" that combine the slides with timing and filter instructions. The output is a video spec of instructions that are then converted with deterministic code into an FFMPEG command to generate the final video.

# Decisions
- The only media generation is the images, by purposefully stylizing the images we can rely on smaller, cheaper image models.
- Timing calculations are all relative to a variable video length input param, all the math happens in the deterministic code, LLM is the "director"
- - By Ensuring file generation logic is deterministic taking keyword specs, we keep the business logic and the configuration layers separate so generation code and prompt chain can be tested separately

# How It Started
<video controls width="640">
  <source src="https://raw.githubusercontent.com/raymond8505/recipe-music-video/main/public/example/Spaghetti_Aglio_e_olio_v1.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

# How It's Going
<video controls width="640">
  <source src="https://raw.githubusercontent.com/raymond8505/recipe-music-video/main/public/example/Spaghetti_Aglio_e_olio.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>